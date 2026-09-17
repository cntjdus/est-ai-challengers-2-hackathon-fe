import { isValidNickname } from '../utils/profileValidation.js'
import { blankPreferences, normalizeTags } from '../utils/preferenceDraft.js'

export const emptyPreferences = blankPreferences

export function frequencyFromCount(count) {
  if (count === 0) return '0'
  if (count <= 2) return '1-2'
  if (count <= 4) return '3-4'
  return '5+'
}

function avatarUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : '' }
  catch { return '' }
}

export function mapAccount(user, profile, preferences) {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
  return {
    account: { id: user.id, name, email: user.email || '', nickname: name.slice(0, 2) || '회원', avatarUrl: avatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture) },
    nickname: profile.display_name || '',
    onboardingCompleted: Boolean(profile.onboarding_completed_at),
    preferences: {
      householdType: 'single',
      cookingFrequency: preferences?.cooking_frequency || frequencyFromCount(preferences?.weekly_cooking_count ?? 3),
      dietStyles: preferences?.preferred_tastes || [],
      excludedIngredients: preferences?.excluded_ingredients || [],
      allergies: preferences?.allergies || [],
    },
    alerts: { expirationAlert: preferences?.expiry_alert_enabled ?? false, recipeSuggestionAlert: preferences?.recipe_suggestion_enabled ?? false },
  }
}

export function preferencePayload(userId, preferences, alerts) {
  if (!['0', '1-2', '3-4', '5+'].includes(preferences?.cookingFrequency)) throw new Error('요리 횟수를 선택해주세요.')
  if (typeof alerts?.expirationAlert !== 'boolean' || typeof alerts?.recipeSuggestionAlert !== 'boolean') throw new Error('알림 설정을 다시 확인해주세요.')
  return {
    user_id: userId, cooking_frequency: preferences.cookingFrequency,
    preferred_tastes: normalizeTags(preferences.dietStyles),
    excluded_ingredients: normalizeTags(preferences.excludedIngredients),
    ...(preferences.allergies === undefined ? {} : { allergies: normalizeTags(preferences.allergies) }),
    expiry_alert_enabled: alerts.expirationAlert, recipe_suggestion_enabled: alerts.recipeSuggestionAlert,
  }
}

// Only use the authenticated client: never a service-role key in the browser.
export async function loadAccount(client, user) {
  let { data: profile, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (!profile) {
    const { error: insertError } = await client.from('profiles').upsert({ id: user.id, display_name: '' }, { onConflict: 'id', ignoreDuplicates: true })
    if (insertError) throw insertError
    const result = await client.from('profiles').select('*').eq('id', user.id).single()
    if (result.error) throw result.error
    profile = result.data
  }
  const result = await client.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
  if (result.error) throw result.error
  return mapAccount(user, profile, result.data)
}

export async function saveAccount(client, user, draft, completeOnboarding = false) {
  if (!user?.id) throw new Error('Session changed')
  if (!isValidNickname(draft?.nickname)) throw new Error('닉네임은 한글, 영문, 숫자 2~12자로 입력해주세요.')
  const { user_id: _userId, ...preferences } = preferencePayload(user.id, draft.preferences, draft.alerts)
  // One transaction: profiles and preferences either both save or neither saves.
  // Return server values directly, avoiding a second read after a successful write.
  const { data, error } = await client.rpc('hk_save_my_profile', {
    p_draft: { user_id: user.id, display_name: draft.nickname.trim(), preferences },
    p_complete_onboarding: completeOnboarding,
  })
  if (error) throw error
  if (!data?.profile || data.profile.id !== user.id || data.preferences?.user_id !== user.id) throw new Error('Session changed')
  return mapAccount(user, data.profile, data.preferences)
}
