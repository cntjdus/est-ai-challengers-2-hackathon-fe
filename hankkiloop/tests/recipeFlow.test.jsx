import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import App from '../src/App'
import { loadRecipeCatalog } from '../src/data/recipeApi'
import { loadInventory, mapInventoryRows, saveInventoryItem, changeInventoryBatch } from '../src/data/fridgeApi'
vi.mock('../src/data/recipeApi', async original => ({ ...await original(), loadRecipeCatalog: vi.fn() }))
vi.mock('../src/data/fridgeApi', async original => ({ ...await original(), loadInventory: vi.fn(), saveInventoryItem: vi.fn(), changeInventoryBatch: vi.fn() }))
const profile = { account: { id: 'test-user' }, nickname: '테스트', preferences: { allergies: [], excludedIngredients: [], dietStyles: [] }, alerts: {} }
const recipe = { id:'recipe-uuid',title:'DB 계란 요리',servings:1,minutes:5,difficulty:'초급',tools:[],description:'',steps:[{step:1,description:'익히기'}],ingredients:[{id:'food:egg:ea',foodId:'egg',name:'계란',quantity:2,unit:'개',step:1}],ingredientSummary:'계란' }
let rows
beforeEach(() => {
  vi.clearAllMocks()
  rows = [{id:'lot-a',display_name:'계란',quantity:4,unit:'ea',storage_type:'fridge',purchased_on:'2026-09-15',tracking_date:'2026-09-30',updated_at:'v1'}]
  loadInventory.mockImplementation(async () => mapInventoryRows(rows))
  loadRecipeCatalog.mockResolvedValue({ recipes:[recipe], foods:[{id:'egg',name:'계란'}], aliases:[] })
})
const mount = () => render(<App initialProfile={profile} onSaveProfile={vi.fn()} onSignOut={vi.fn()} />)
it('opens a DB UUID detail URL after reload and calculates portions', async () => {
  history.replaceState({},'', '/recipe/recipe-uuid')
  mount()
  expect(await screen.findByRole('heading',{name:'DB 계란 요리'})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'인분 늘리기'}))
  fireEvent.click(screen.getByRole('button',{name:'인분 늘리기'}))
  expect(screen.getByText(/부족 2개/)).toBeTruthy()
  expect(screen.queryByText('제육볶음')).toBeNull()
})
it('shows a retryable catalog error and then an empty DB', async () => {
  history.replaceState({},'', '/recipe')
  loadRecipeCatalog.mockRejectedValueOnce(new Error('읽기 실패')).mockResolvedValue({recipes:[],foods:[],aliases:[]})
  mount()
  expect(await screen.findByRole('alert')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'다시 불러오기'}))
  expect(await screen.findByText('등록된 레시피가 없거나 설정에 따라 모두 제외되었습니다.')).toBeTruthy()
  expect(screen.queryByText('제육볶음')).toBeNull()
})
it('saves an edit, reloads it from DB, and requires confirmation for discard', async () => {
  history.replaceState({},'', '/fridge/lot-a')
  saveInventoryItem.mockImplementation(async (_client,_row,draft) => {
    rows = [{...rows[0],display_name:draft.name,quantity:Number(draft.quantity),storage_type:draft.storage,tracking_date:draft.date,updated_at:'v2'}]
  })
  changeInventoryBatch.mockImplementation(async () => { rows = [] })
  const first = mount()
  await screen.findByTestId('ingredient-name')
  fireEvent.click(screen.getByRole('button',{name:'남은 양 수정'}))
  fireEvent.change(screen.getByLabelText('재료 이름 수정'),{target:{value:'달걀'}})
  fireEvent.change(screen.getByLabelText('남은 수량'),{target:{value:'3'}})
  fireEvent.change(screen.getByLabelText('보관장소 수정'),{target:{value:'freezer'}})
  fireEvent.change(screen.getByLabelText('소비기한 수정'),{target:{value:'2026-10-01'}})
  fireEvent.click(screen.getByRole('button',{name:'변경 내용 저장'}))
  await waitFor(() => expect(screen.getByTestId('ingredient-amount').textContent).toBe('3개'))
  first.unmount()
  mount()
  expect((await screen.findByTestId('ingredient-name')).textContent).toBe('달걀')
  expect(screen.getByTestId('ingredient-amount').textContent).toBe('3개')
  fireEvent.click(screen.getByRole('button',{name:'냉장고에서 제거'}))
  expect(changeInventoryBatch).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button',{name:'폐기 처리'}))
  await waitFor(() => expect(location.pathname).toBe('/fridge'))
  expect(changeInventoryBatch.mock.calls[0][1]).toEqual([expect.objectContaining({id:'lot-a',delta:-3,status:'discarded'})])
  expect(screen.queryByTestId('ingredient-name')).toBeNull()
})
