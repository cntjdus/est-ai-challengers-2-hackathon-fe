import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import App from '../src/App'
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
