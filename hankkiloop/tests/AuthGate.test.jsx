import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ callback: null, auth: { getSession: vi.fn(), getUser: vi.fn(), onAuthStateChange: vi.fn(), signInWithOAuth: vi.fn(), signOut: vi.fn() }, load: vi.fn(), save: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ supabase: { auth: mock.auth } }))
vi.mock('../src/auth/profile', () => ({ loadAccount: mock.load, saveAccount: mock.save }))
vi.mock('../src/App', () => ({ default: ({ initialProfile, onSignOut }) => <div>앱 계정: {initialProfile.account.id}<button onClick={onSignOut}>로그아웃</button></div> }))
import AuthGate from '../src/auth/AuthGate'
import LoginPage from '../src/pages/LoginPage'

const user = { id: 'user-a', email: 'a@example.com' }
const session = { user, access_token: 'test-only' }
const profile = { account: { ...user, name: '사용자' }, nickname: '테스트', onboardingCompleted: true, preferences: { householdType: 'single', cookingFrequency: '3-4', dietStyles: [], excludedIngredients: [] }, alerts: { expirationAlert: false, recipeSuggestionAlert: false } }

beforeEach(() => {
  history.replaceState(null, '', '/')
  sessionStorage.clear()
  vi.resetAllMocks()
  mock.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  mock.auth.getUser.mockResolvedValue({ data: { user }, error: null })
  mock.auth.onAuthStateChange.mockImplementation((callback) => { mock.callback = callback; return { data: { subscription: { unsubscribe: vi.fn() } } } })
  mock.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
  mock.auth.signOut.mockResolvedValue({ error: null })
  mock.load.mockResolvedValue(profile)
})

describe('authentication boundary', () => {
  it('guards direct private links and asks Supabase for Google PKCE login', async () => {
    history.replaceState(null, '', '/fridge')
    render(<AuthGate />)
    fireEvent.click(await screen.findByRole('button', { name: 'Google 계정으로 계속하기' }))
    await waitFor(() => expect(mock.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } } }))
    expect(location.pathname).toBe('/login')
    expect(screen.queryByText(/앱 계정/)).toBeNull()
  })
  it('disables login gracefully when configuration is missing', () => {
    render(<LoginPage configured={false} />)
    expect(screen.getByRole('button', { name: 'Google 계정으로 계속하기' }).disabled).toBe(true)
    expect(screen.getByRole('status').textContent).toContain('로그인 연결')
  })
  it('restores an existing session and handles sign out', async () => {
    mock.auth.getSession.mockResolvedValue({ data: { session }, error: null })
    render(<AuthGate />)
    expect(await screen.findByText('앱 계정: user-a')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(await screen.findByRole('button', { name: 'Google 계정으로 계속하기' })).toBeTruthy()
    expect(location.pathname).toBe('/login')
    expect(history.state).toBeNull()
  })
  it('shows a retry action for profile errors instead of entering the app', async () => {
    mock.auth.getSession.mockResolvedValue({ data: { session }, error: null })
    mock.load.mockRejectedValueOnce({ code: '42501' }).mockResolvedValueOnce(profile)
    render(<AuthGate />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText(/앱 계정/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('앱 계정: user-a')).toBeTruthy()
  })
  it('surfaces provider failures with a usable retry button', async () => {
    mock.auth.signInWithOAuth.mockResolvedValue({ error: { message: 'provider is not enabled' } })
    render(<AuthGate />)
    fireEvent.click(await screen.findByRole('button', { name: 'Google 계정으로 계속하기' }))
    expect((await screen.findByRole('alert')).textContent).toContain('준비 중')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Google 계정으로 계속하기' }).disabled).toBe(false))
  })
  it('keeps onboarding on screen after a failed save and allows retry', async () => {
    mock.auth.getSession.mockResolvedValue({ data: { session }, error: null })
    mock.load.mockResolvedValue({ ...profile, onboardingCompleted: false })
    mock.save.mockRejectedValueOnce({ code: '42501' }).mockResolvedValueOnce(profile)
    render(<AuthGate />)
    const required = await screen.findByRole('checkbox', { name: /필수/ })
    fireEvent.click(required)
    fireEvent.click(screen.getByRole('button', { name: /취향 설정하고 시작하기/ }))
    fireEvent.click(await screen.findByRole('button', { name: '한끼루프 시작하기' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText(/앱 계정/)).toBeNull()
    expect(mock.save.mock.calls[0][2].alerts).toEqual({ expirationAlert: false, recipeSuggestionAlert: false })
    fireEvent.click(screen.getByRole('button', { name: '한끼루프 시작하기' }))
    expect(await screen.findByText('앱 계정: user-a')).toBeTruthy()
  })
  it('ignores stale profile results after a session is signed out', async () => {
    let finish
    mock.auth.getSession.mockResolvedValue({ data: { session }, error: null })
    mock.load.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    render(<AuthGate />)
    await waitFor(() => expect(mock.load).toHaveBeenCalled())
    act(() => mock.callback('SIGNED_OUT', null))
    await act(async () => finish(profile))
    expect(await screen.findByRole('button', { name: 'Google 계정으로 계속하기' })).toBeTruthy()
    expect(screen.queryByText(/앱 계정/)).toBeNull()
  })
})
