import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
  const recipe = { id: 'r', title: '감자 요리', servings: 1, ingredients: [], tools: [], steps: [] }
  render(<RecipeDetail recipes={[recipe]} recipeId="r" savedIds={[]} inventory={{}} onAddShopping={add} />)
  fireEvent.click(screen.getByRole('button', { name: '부족한 필수 재료 장바구니 담기' }))
  await screen.findByText('응답 실패')
  fireEvent.click(screen.getByRole('button', { name: '부족한 필수 재료 장바구니 담기' }))
  await waitFor(() => expect(add).toHaveBeenCalledTimes(2))
  expect(add.mock.calls[0][2]).toBe(add.mock.calls[1][2])
})
