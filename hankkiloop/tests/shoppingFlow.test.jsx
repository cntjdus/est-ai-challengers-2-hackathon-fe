import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import Cart from '../src/pages/Cart'
import RecipeDetail from '../src/pages/RecipeDetail'
it('renders an empty cart and a path back to recipes without sample products', () => {
  render(<Cart items={[]} onItemsChange={vi.fn()} onNavigate={vi.fn()} />)
  expect(screen.getByText('장바구니가 비어 있어요.')).toBeTruthy()
  expect(screen.queryByText('싱싱 대파 1단')).toBeNull()
  expect(screen.getByRole('button', { name: '레시피에서 부족한 재료 담기' })).toBeTruthy()
})
it('shows a retry instead of claiming the cart is empty when the request fails', () => {
  const retry = vi.fn()
  render(<Cart items={[]} onItemsChange={vi.fn()} error="연결 실패" onRetry={retry} />)
  expect(screen.queryByText('장바구니가 비어 있어요.')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
  expect(retry).toHaveBeenCalledOnce()
})
it('does not remove a card when persistence fails', async () => {
  const item = { id: 'a', name: '감자', quantity: 1, packageAmount: 100, plannedUsage: 100, amountUnit: 'g', selected: true, recipeTitles: [] }
  render(<Cart items={[item]} onItemsChange={vi.fn().mockRejectedValue(new Error('연결 실패'))} />)
  fireEvent.click(screen.getByRole('button', { name: '감자 삭제' }))
  expect(await screen.findByText('저장 실패: 연결 실패')).toBeTruthy()
  expect(screen.getByRole('article', { name: '감자' })).toBeTruthy()
})
it('reuses the same add request ID on retry so a lost response cannot duplicate the plan', async () => {
  const add = vi.fn().mockRejectedValueOnce(new Error('응답 실패')).mockResolvedValue()
  const recipe = { id: 'r', title: '감자 요리', servings: 1, ingredients: [{ id: 'potato', name: '감자', quantity: 100, unit: 'g' }], tools: [], steps: [] }
  render(<RecipeDetail recipes={[recipe]} recipeId="r" savedIds={[]} inventory={{}} onAddShopping={add} />)
  fireEvent.click(screen.getByRole('button', { name: '감자 장바구니 담기' }))
  await screen.findByText('응답 실패')
  fireEvent.click(screen.getByRole('button', { name: '감자 장바구니 담기' }))
  await waitFor(() => expect(add).toHaveBeenCalledTimes(2))
  expect(add.mock.calls[0][2]).toBe(add.mock.calls[1][2])
  expect(add.mock.calls[0][3]).toBe('potato')
})

it('reflects fridge and cart states and restores adding after cart removal', () => {
  const ingredient = { id: 'food:potato:g', name: '감자', quantity: 100, unit: 'g' }
  const recipe = { id: 'r', title: '감자 요리', servings: 1, ingredients: [ingredient], tools: [], steps: [] }
  const props = { recipes: [recipe], recipeId: 'r', savedIds: [], inventory: { [ingredient.id]: 50 }, onAddShopping: vi.fn() }
  const view = render(<RecipeDetail {...props} shoppingProps={{ items: [] }} />)
  expect(screen.getByRole('button', { name: '감자 냉장고에 있음, 장바구니 담기' }).textContent).toBe('있음')
  view.rerender(<RecipeDetail {...props} shoppingProps={{ items: [{ ingredientId: ingredient.id }] }} />)
  const added = screen.getByRole('button', { name: '감자 장바구니 담김' })
  expect(added.textContent).toBe('담김')
  expect(added.disabled).toBe(true)
  fireEvent.click(added)
  expect(props.onAddShopping).not.toHaveBeenCalled()
  view.rerender(<RecipeDetail {...props} inventory={{}} shoppingProps={{ items: [] }} />)
  const available = screen.getByRole('button', { name: '감자 장바구니 담기' })
  expect(available.textContent).toBe('담기 +')
  expect(available.disabled).toBe(false)
})

it('completes fridge registration inside the recipe sheet without navigating', async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  history.replaceState({}, '', '/recipe/r')
  const recipe = { id: 'r', title: '감자 요리', servings: 1, ingredients: [], tools: [], steps: [] }
  const item = { id: 'a', name: '감자', shortName: '감자', dbRow: {}, foodId: 'potato', dbUnit: 'g', quantity: 1, packageAmount: 100, amountUnit: 'g', selected: true, recipeTitles: [] }
  const onRegister = vi.fn().mockRejectedValueOnce(new Error('등록 실패')).mockResolvedValue()
  render(<RecipeDetail recipes={[recipe]} recipeId="r" savedIds={[]} inventory={{}} shoppingProps={{ items: [item], onItemsChange: vi.fn(), onNavigate: vi.fn(), onRegister }} />)
  fireEvent.click(screen.getByRole('button', { name: '장보러 가기' }))
  fireEvent.click(screen.getByRole('button', { name: '장보기 완료하고 냉장고 등록' }))
  expect(screen.getByRole('dialog', { name: '재료 등록' })).toBeTruthy()
  expect(location.pathname).toBe('/recipe/r')
  fireEvent.change(screen.getByLabelText('소비기한'), { target: { value: '2099-12-31' } })
  fireEvent.click(screen.getByRole('button', { name: '확인하고 냉장고에 등록하기' }))
  expect(await screen.findByText('등록 실패')).toBeTruthy()
  expect(screen.getByRole('dialog', { name: '재료 등록' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '확인하고 냉장고에 등록하기' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(screen.getByText('1개 재료를 냉장고에 등록했어요.')).toBeTruthy()
  expect(location.pathname).toBe('/recipe/r')
  expect(history.state.registrationDraft).toBeUndefined()
})

it('opens shopping in a sheet and preserves the cooking completion sheet', async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  const recipe = { id: 'r', title: '감자 요리', servings: 1, ingredients: [], tools: [], steps: [] }
  render(<RecipeDetail recipes={[recipe]} recipeId="r" savedIds={[]} inventory={{}} shoppingProps={{ items: [], onItemsChange: vi.fn(), onNavigate: vi.fn() }} />)
  fireEvent.click(screen.getByRole('button', { name: '장보러 가기' }))
  expect(screen.getByRole('dialog', { name: '장바구니' })).toBeTruthy()
  expect(screen.getByText('장바구니가 비어 있어요.')).toBeTruthy()
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '뒤로가기' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: '요리 완료' }))
  expect(screen.getByRole('dialog', { name: '사용한 식재료 재고 차감' })).toBeTruthy()
})

it('opens the package finder from an item in the recipe shopping sheet', async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  const recipe = { id: 'r', title: '감자 요리', servings: 1, ingredients: [], tools: [], steps: [] }
  const item = { id: 'a', name: '감자', shortName: '감자', dbRow: {}, foodId: 'potato', dbUnit: 'g', quantity: 1, packageAmount: 100, amountUnit: 'g', selected: true, recipeTitles: [] }
  render(<RecipeDetail recipes={[recipe]} recipeId="r" savedIds={[]} inventory={{}} shoppingProps={{ items: [item], onItemsChange: vi.fn(), onNavigate: vi.fn(), onReplacePackage: vi.fn() }} />)
  fireEvent.click(screen.getByRole('button', { name: '장보러 가기' }))
  fireEvent.click(screen.getByRole('button', { name: '감자 재료 등록' }))
  const option = screen.getByRole('button', { name: /소포장 찾기/ })
  fireEvent.click(option)
  expect(screen.getByRole('heading', { name: '소포장 식재료 찾기' })).toBeTruthy()
  fireEvent.click(within(screen.getByRole('dialog', { name: '소포장 식재료 찾기' })).getByRole('button', { name: '뒤로가기' }))
  expect(screen.getByRole('button', { name: /소포장 찾기/ })).toBeTruthy()
})
