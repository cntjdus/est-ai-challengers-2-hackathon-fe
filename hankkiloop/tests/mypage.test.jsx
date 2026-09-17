import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import MyPage from '../src/pages/MyPage'
import { collectPreferenceDraft } from '../src/utils/preferenceDraft'

vi.mock('../src/components/mypage/PushSettings', () => ({ default: () => null }))
const profile = {
  account: { id: 'user-a', name: '테스트', email: 'test@example.com', nickname: '회원' }, nickname: '테스트회원',
  preferences: { householdType: 'single', cookingFrequency: '3-4', dietStyles: [], excludedIngredients: [], allergies: [] },
  alerts: { expirationAlert: false, recipeSuggestionAlert: false },
}
function props(overrides = {}) {
  return { account: profile.account, nickname: profile.nickname, initialPreferences: structuredClone(profile.preferences), initialAlerts: { ...profile.alerts }, onEditProfile: vi.fn(), onNavigate: vi.fn(), onSignOut: vi.fn().mockResolvedValue(), onSaveSettings: vi.fn(async draft => ({ ...profile, ...draft })), ...overrides }
}
beforeEach(() => { window.history.replaceState({}, '', '/mypage') })

it('saves pending text without requiring Enter and shows canonical saved state', async () => {
  const options = props()
  render(<MyPage {...options} />)
  fireEvent.change(screen.getByLabelText('선호 식단 키워드'), { target: { value: '#한식' } })
  fireEvent.change(screen.getByLabelText('제외 재료 검색'), { target: { value: '오이' } })
  fireEvent.change(screen.getByLabelText('알레르기 재료 입력'), { target: { value: '우유' } })
  fireEvent.click(screen.getByRole('button', { name: '설정 저장' }))
  await screen.findByText('설정을 저장했어요.')
  expect(options.onSaveSettings).toHaveBeenCalledWith({ preferences: { ...profile.preferences, dietStyles: ['한식'], excludedIngredients: ['오이'], allergies: ['우유'] }, alerts: profile.alerts })
  expect(screen.getByLabelText('제외 재료 검색').value).toBe('')
  expect(screen.queryByText('저장하지 않은 변경사항이 있어요.')).toBeNull()
})
it('keeps drafts on failure and permits retry', async () => {
  const options = props()
  options.onSaveSettings.mockRejectedValueOnce({ code: '42501' })
  render(<MyPage {...options} />)
  fireEvent.change(screen.getByLabelText('제외 재료 검색'), { target: { value: '오이' } })
  fireEvent.click(screen.getByRole('button', { name: '설정 저장' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('제외 재료 검색').value).toBe('오이')
  expect(screen.queryByText('설정을 저장했어요.')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '설정 저장' }))
  await screen.findByText('설정을 저장했어요.')
  expect(options.onSaveSettings).toHaveBeenCalledTimes(2)
})
it('guards duplicate save clicks while the request is pending', async () => {
  let finish
  const save = vi.fn(draft => new Promise(resolve => { finish = () => resolve({ ...profile, ...draft }) }))
  render(<MyPage {...props({ onSaveSettings: save })} />)
  fireEvent.click(screen.getByRole('button', { name: '설정 저장' }))
  const button = screen.getByRole('button', { name: '처리 중…' })
  fireEvent.click(button)
  expect(save).toHaveBeenCalledTimes(1)
  await act(async () => finish())
  await screen.findByText('설정을 저장했어요.')
})
it('supports mobile add buttons for allergy ingredients', async () => {
  const options = props()
  render(<MyPage {...options} />)
  fireEvent.change(screen.getByLabelText('알레르기 재료 입력'), { target: { value: '땅콩' } })
  fireEvent.click(screen.getByRole('button', { name: '알레르기 재료 추가' }))
  expect(screen.getByLabelText('알레르기 재료 입력').value).toBe('')
  fireEvent.click(screen.getByRole('button', { name: '설정 저장' }))
  await screen.findByText('설정을 저장했어요.')
  expect(options.onSaveSettings.mock.calls[0][0].preferences.allergies).toEqual(['땅콩'])
})
it('does not add a tag while Korean IME composition is in progress', () => {
  render(<MyPage {...props()} />)
  const input = screen.getByLabelText('제외 재료 검색')
  fireEvent.change(input, { target: { value: '오이' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 })
  expect(input.value).toBe('오이')
})
it('can cancel leaving a dirty profile through the edit button', () => {
  const options = props()
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  render(<MyPage {...options} />)
  fireEvent.change(screen.getByLabelText('제외 재료 검색'), { target: { value: '오이' } })
  fireEvent.click(screen.getByRole('button', { name: '개인정보 수정' }))
  expect(confirm).toHaveBeenCalledTimes(1)
  expect(options.onEditProfile).not.toHaveBeenCalled()
  confirm.mockRestore()
})
it('allows sign-out from a clean profile', async () => {
  const options = props()
  render(<MyPage {...options} />)
  fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
  await waitFor(() => expect(options.onSignOut).toHaveBeenCalledOnce())
})
it('initializes a remounted page from saved preferences instead of samples', () => {
  const saved = collectPreferenceDraft(profile.preferences, { ingredientInput: '오이', allergyInput: '우유' })
  render(<MyPage {...props({ initialPreferences: saved })} />)
  expect(screen.getByRole('button', { name: '오이 제외 해제' })).toBeTruthy()
  expect(screen.getByRole('button', { name: '우유 제외 해제' })).toBeTruthy()
})
