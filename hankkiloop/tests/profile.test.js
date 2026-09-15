import { describe, expect, it, vi } from 'vitest'
import { frequencyFromCount, mapAccount, preferencePayload, loadAccount, saveAccount } from '../src/auth/profile'
import { createUserHistory, safeReturnPath } from '../src/auth/navigation'
import { readCallbackError } from '../src/auth/errors'

const user = { id: 'user-a', email: 'a@example.com', user_metadata: { full_name: 'Google Name' } }
const preferences = { cookingFrequency: '5+', dietStyles: ['한식', '한식'], excludedIngredients: [] }
const alerts = { expirationAlert: true, recipeSuggestionAlert: false }

function resultChain(result) {
  const chain = {}
  for (const method of ['select', 'eq', 'maybeSingle', 'single', 'upsert', 'update']) chain[method] = vi.fn(() => chain)
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return chain
}

describe('account persistence', () => {
  it('uses authenticated identity and preserves existing profile/preferences', () => {
    const result = mapAccount(user, { display_name: '성한', onboarding_completed_at: '2026-09-15' }, { weekly_cooking_count: 0, preferred_tastes: [], excluded_ingredients: ['오이'], expiry_alert_enabled: false })
    expect(result.account.id).toBe('user-a')
    expect(result.nickname).toBe('성한')
    expect(result.preferences.cookingFrequency).toBe('0')
    expect(result.alerts).toEqual({ expirationAlert: false, recipeSuggestionAlert: false })
  })
  it('does not invent an exact cooking count or overwrite allergies', () => {
    const result = preferencePayload(user.id, preferences, alerts)
    expect(result.cooking_frequency).toBe('5+')
    expect(result.preferred_tastes).toEqual(['한식'])
    expect(result).not.toHaveProperty('weekly_cooking_count')
    expect(result).not.toHaveProperty('allergies')
  })
  it('maps legacy counts to valid UI buckets', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(frequencyFromCount)).toEqual(['0', '1-2', '1-2', '3-4', '3-4', '5+', '5+'])
  })
  it('rejects malformed preferences before any request', () => {
    expect(() => preferencePayload(user.id, { ...preferences, cookingFrequency: '99' }, alerts)).toThrow()
    expect(() => preferencePayload(user.id, { ...preferences, dietStyles: [{}] }, alerts)).toThrow()
  })
  it('does not overwrite a profile created by a signup trigger', async () => {
    const profile = resultChain({ data: { display_name: '기존사용자', onboarding_completed_at: '2026-09-15' }, error: null })
    const prefs = resultChain({ data: null, error: null })
    const client = { from: vi.fn((name) => name === 'profiles' ? profile : prefs) }
    expect((await loadAccount(client, user)).nickname).toBe('기존사용자')
    expect(profile.upsert).not.toHaveBeenCalled()
  })
  it('creates a missing profile without replacing a concurrent trigger insert', async () => {
    const existing = resultChain({ data: null, error: null })
    const insert = resultChain({ error: null })
    const reread = resultChain({ data: { display_name: '트리거닉네임' }, error: null })
    const prefs = resultChain({ data: null, error: null })
    const client = { from: vi.fn().mockReturnValueOnce(existing).mockReturnValueOnce(insert).mockReturnValueOnce(reread).mockReturnValueOnce(prefs) }
    expect((await loadAccount(client, user)).nickname).toBe('트리거닉네임')
    expect(insert.upsert).toHaveBeenCalledWith({ id: user.id, display_name: '' }, { onConflict: 'id', ignoreDuplicates: true })
  })
  it('does not mark onboarding complete when preferences fail', async () => {
    const client = { from: vi.fn(() => resultChain({ error: { code: '42501' } })) }
    await expect(saveAccount(client, user, { nickname: '성한', preferences, alerts }, true)).rejects.toEqual({ code: '42501' })
    expect(client.from).toHaveBeenCalledTimes(1)
    expect(client.from).toHaveBeenCalledWith('user_preferences')
  })
})

describe('navigation isolation', () => {
  it('rejects external and unfinished checkout return paths', () => {
    for (const path of ['//evil.example', 'https://evil.example', '/auth/callback', '/shopping/register', '/\\evil.example', null]) expect(safeReturnPath(path)).toBe('/')
    expect(safeReturnPath('/fridge')).toBe('/fridge')
    expect(safeReturnPath('/recipe/recipe-1')).toBe('/recipe/recipe-1')
  })
  it('drops legacy and different-user browser history', () => {
    const native = { state: { ownerId: 'other', inventory: { tofu: 5 } }, replaceState: vi.fn(function (s) { this.state = s }), pushState: vi.fn(), back: vi.fn() }
    const history = createUserHistory('me', native)
    expect(history.readState()).toEqual({ ownerId: 'me' })
    native.state = { ownerId: 'other', registrationDraft: [{ name: 'private' }] }
    expect(history.readState()).toBeNull()
    history.replaceState({ cartItems: [] }, '', '/')
    expect(native.state).toEqual({ ownerId: 'me', cartItems: [] })
  })
  it('never displays raw OAuth callback text', () => {
    expect(readCallbackError('https://app.example/auth/callback?error=access_denied&error_description=secret')).toContain('취소')
    expect(readCallbackError('https://app.example/auth/callback?error=unknown&error_description=secret')).not.toContain('secret')
  })
})
