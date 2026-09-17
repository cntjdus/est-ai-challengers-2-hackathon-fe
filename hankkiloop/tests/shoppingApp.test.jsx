import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import App from '../src/App'
vi.mock('../src/data/userStateApi', () => ({ loadSavedRecipes: vi.fn().mockResolvedValue([]), loadNotificationReads: vi.fn().mockResolvedValue([]) }))
import { loadShopping } from '../src/data/shoppingApi'
vi.mock('../src/data/fridgeApi', async original => ({ ...await original(), loadInventory: vi.fn().mockResolvedValue({ inventory: {}, registrations: Object.assign([], { database: true }) }) }))
vi.mock('../src/data/recipeApi', async original => ({ ...await original(), loadRecipeCatalog: vi.fn().mockResolvedValue({ recipes: [], foods: [], aliases: [] }) }))
vi.mock('../src/data/shoppingApi', async original => ({ ...await original(), loadShopping: vi.fn().mockResolvedValue([]) }))
const profile = { account: { id: 'user-a' }, nickname: '사용자', preferences: { allergies: [], excludedIngredients: [] }, alerts: {} }
it('ignores old browser history mock cart items and restores only DB results', async () => {
  history.replaceState({ ownerId: 'user-a', cartItems: [{ id: 'cart-green-onion', name: '싱싱 대파 1단' }] }, '', '/shopping')
  render(<App initialProfile={profile} />)
  expect(await screen.findByText('장바구니가 비어 있어요.')).toBeTruthy()
  expect(screen.queryByText('싱싱 대파 1단')).toBeNull()
  expect(loadShopping.mock.calls[0][1]).toBe('user-a')
})
it('allows retry after a shopping lookup failure', async () => {
  loadShopping.mockRejectedValueOnce(new Error('접속 실패')).mockResolvedValue([])
  history.replaceState({}, '', '/shopping')
  render(<App initialProfile={profile} />)
  expect(await screen.findByText('장바구니 조회 실패: 접속 실패')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
  expect(await screen.findByText('장바구니가 비어 있어요.')).toBeTruthy()
})
it('opens the small package finder from registration and returns to the form', async () => {
  const item = { id: 'cart-onion', foodId: 'onion', ingredientId: 'food:onion:g', name: '대파', shortName: '대파', quantity: 1, packageAmount: 300, amountUnit: 'g', plannedUsage: 100, inventoryQuantity: 300, selected: true, dbRow: {} }
  loadShopping.mockResolvedValueOnce([item])
  history.replaceState({ ownerId: 'user-a', registrationId: 'registration', registrationItems: [{ id: item.id }], fromShopping: true }, '', '/shopping/register')
  render(<App initialProfile={profile} />)
  const option = await screen.findByRole('button', { name: /소포장 찾기/ })
  fireEvent.click(option)
  expect(await screen.findByRole('heading', { name: '소포장 식재료 찾기' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '뒤로가기' }))
  expect(await screen.findByRole('heading', { name: '재료 등록' })).toBeTruthy()
  expect(screen.getByRole('button', { name: /소포장 찾기/ })).toBeTruthy()
})
