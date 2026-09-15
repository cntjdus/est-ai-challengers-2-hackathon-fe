import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { mapInventoryRows, toRegistrationPayload, planDeductions, loadInventory } from '../src/data/fridgeApi'
import { buildFridgeItems } from '../src/data/inventory'
import { preferencePayload, mapAccount } from '../src/auth/profile'
import MaterialRegister from '../src/pages/MaterialRegister'
const row = { id: 'lot-a', display_name: '테스트재료', quantity: 240, unit: 'g', storage_type: 'fridge', purchased_on: '2026-09-15', tracking_date: '2026-09-20' }
describe('DB inventory', () => {
  it('shows empty DB without demo seeds and retains separate lots', () => {
    const empty = mapInventoryRows([])
    expect(buildFridgeItems(empty.inventory, empty.registrations)).toEqual([])
    const result = mapInventoryRows([row, { ...row, id: 'lot-b', quantity: 100, tracking_date: null }])
    const items = buildFridgeItems(result.inventory, result.registrations, new Date('2026-09-15T12:00:00'))
    expect(items.map(i => i.id)).toEqual(['lot-a','lot-b'])
    expect(items[0].amount).toBe(240)
    expect(items[1].daysLeft).toBeNull()
    expect(items[1].status).toBe('unknown')
  })
  it('never guesses grams per piece to match a recipe', () => {
    const result = mapInventoryRows([{ ...row, display_name: '두부', unit: 'g', quantity: 300 }])
    expect(result.inventory.tofu).toBeUndefined()
    expect(result.inventory['db:두부:g']).toBe(300)
  })
  it('rejects unsupported units and precision before sending', () => {
    expect(() => toRegistrationPayload([{ purchaseAmount:'1', unit:'통' }], ['id'])).toThrow()
    expect(() => toRegistrationPayload([{ purchaseAmount:'1.12345', unit:'g' }], ['id'])).toThrow()
  })
  it('allocates the earliest dated lots and rejects over-consumption', () => {
    const lots = [{ id:'b', ingredientId:'same', purchaseAmount:100, expiryDate:'2026-10-01' }, { id:'a', ingredientId:'same', purchaseAmount:40, expiryDate:'2026-09-20' }]
    const changes = planDeductions(lots, [{id:'same',deduct:60}])
    expect(changes.map(({id,delta,status}) => ({id,delta,status}))).toEqual([{id:'a',delta:-40,status:'consumed'},{id:'b',delta:-20,status:'active'}])
    expect(() => planDeductions(lots,[{id:'same',deduct:200}])).toThrow()
  })
  it('filters reads by authenticated owner and surfaces failures', async () => {
    const chain = { select:vi.fn(() => chain), eq:vi.fn(() => chain), order:vi.fn().mockResolvedValue({error:new Error('permission')}) }
    await expect(loadInventory({from:() => chain},'owner')).rejects.toThrow('permission')
    expect(chain.eq).toHaveBeenCalledWith('user_id','owner')
  })
  it('round-trips allergies separately from excluded ingredients', () => {
    const payload = preferencePayload('u',{cookingFrequency:'3-4',dietStyles:[],excludedIngredients:['오이'],allergies:['땅콩','땅콩']},{})
    expect(payload.allergies).toEqual(['땅콩'])
    expect(mapAccount({id:'u'}, {}, payload).preferences.allergies).toEqual(['땅콩'])
  })
})
it('awaits registration and allows retry after a failed write', async () => {
  history.replaceState({},'', '/shopping/register')
  let reject
  const save = vi.fn(() => new Promise((_,r) => {reject=r}))
  render(<MaterialRegister source="fridge-direct" items={[]} onRegister={save} onNavigate={vi.fn()} onBack={vi.fn()} onOpenPackageSolution={vi.fn()} />)
  fireEvent.change(screen.getByLabelText('식재료'), {target:{value:'대파'}})
  fireEvent.change(screen.getByLabelText('구매량'), {target:{value:'240'}})
  fireEvent.change(screen.getByLabelText('구매일'), {target:{value:'2026-09-15'}})
  fireEvent.change(screen.getByLabelText('소비기한'), {target:{value:'2026-09-20'}})
  fireEvent.click(screen.getByRole('button',{name:'확인하고 냉장고에 등록하기'}))
  expect(screen.getByRole('button',{name:'저장 중…'}).disabled).toBe(true)
  fireEvent.click(screen.getByRole('button',{name:'저장 중…'}))
  expect(save).toHaveBeenCalledTimes(1)
  reject(new Error('DB 저장 실패'))
  await screen.findByText('DB 저장 실패')
  await waitFor(() => expect(screen.getByRole('button',{name:'확인하고 냉장고에 등록하기'}).disabled).toBe(false))
})
