import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import App from '../src/App'
vi.mock('../src/data/fridgeApi', async importOriginal => ({ ...await importOriginal(), loadInventory: vi.fn().mockResolvedValue({ inventory: {}, registrations: Object.assign([], { database: true }) }) }))

const profile = {
  account: { id: 'user-b', name: '사용자', email: 'b@example.com', nickname: '회원' },
  nickname: '실제회원',
  preferences: { householdType: 'single', cookingFrequency: '3-4', dietStyles: [], excludedIngredients: [], allergies: [] },
  alerts: { expirationAlert: false, recipeSuggestionAlert: false },
}

beforeEach(() => {
  history.replaceState({ ownerId: 'user-a', nickname: '이전회원', cartItems: [] }, '', '/mypage')
})

it('renders the actual account and persists settings through the app boundary', async () => {
  const save = vi.fn().mockResolvedValue(profile)
  const signOut = vi.fn().mockResolvedValue()
  render(<App initialProfile={profile} onSaveProfile={save} onSignOut={signOut} />)
  expect(await screen.findByText('실제회원')).toBeTruthy()
  expect(screen.queryByText('이전회원')).toBeNull()
  expect(history.state.ownerId).toBe('user-b')
  fireEvent.click(screen.getByRole('button', { name: '설정 저장' }))
  await screen.findByText('설정을 저장했어요.')
  expect(save).toHaveBeenCalledWith({ nickname: '실제회원', preferences: profile.preferences, alerts: profile.alerts })
  fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
  await waitFor(() => expect(signOut).toHaveBeenCalledOnce())
})
