import { isValidNickname } from '../utils/profileValidation.js'

export const emptyPreferences = {
  householdType: 'single', cookingFrequency: '3-4', dietStyles: [], excludedIngredients: [],
}

export function frequencyFromCount(count) {
  if (count === 0) return '0'
  if (count <= 2) return '1-2'
  if (count <= 4) return '3-4'
  return '5+'
}

export function mapAccount(user, profile, preferences) {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
  return {
    account: { id: user.id, name, email: user.email || '', nickname: name.slice(0, 2) || '회원' },
    nickname: profile.display_name || '',
    onboardingCompleted: Boolean(profile.onboarding_completed_at),
    preferences: {
      householdType: 'single',
      cookingFrequency: preferences?.cooking_frequency || frequencyFromCount(preferences?.weekly_cooking_count ?? 3),
      dietStyles: preferences?.preferred_tastes || [],
      excludedIngredients: preferences?.excluded_ingredients || [],
    },
    alerts: {
      expirationAlert: preferences?.expiry_alert_enabled ?? false,
      recipeSuggestionAlert: preferences?.recipe_suggestion_enabled ?? false,
    },
  }
}

export function preferencePayload(userId, preferences, alerts) {
  if (!['0', '1-2', '3-4', '5+'].includes(preferences.cookingFrequency)) throw new Error('요리 횟수를 선택해주세요.')
  const normalizeTags = (tags) => {
    if (!Array.isArray(tags) || tags.length > 50 || tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 50)) {
      throw new Error('식단 태그는 각 50자 이내, 최대 50개까지 입력해주세요.')
    }
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
  }
  return {
    user_id: userId,
    cooking_frequency: preferences.cookingFrequency,
    preferred_tastes: normalizeTags(preferences.dietStyles),
    excluded_ingredients: normalizeTags(preferences.excludedIngredients),
    expiry_alert_enabled: Boolean(alerts.expirationAlert),
    recipe_suggestion_enabled: Boolean(alerts.recipeSuggestionAlert),
    updated_at: new Date().toISOString(),
  }
}

// RLS uses the signed-in JWT. Never use a service-role key in this client.
export async function loadAccount(client, user) {
  let { data: profile, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  if (!profile) {
    // Cooperates with an existing auth.users trigger; a concurrent insert does not overwrite its row.
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
  const nickname = draft.nickname.trim()
  if (!isValidNickname(nickname)) throw new Error('닉네임은 한글, 영문, 숫자 2~12자로 입력해주세요.')
  const payload = preferencePayload(user.id, draft.preferences, draft.alerts)
  // Write preferences first. A failed request must not mark onboarding as complete.
  // Omitted fields (allergies, exact cooking count, alert lead days) are not overwritten on conflict.
  const { error: preferencesError } = await client.from('user_preferences').upsert(payload, { onConflict: 'user_id' })
  if (preferencesError) throw preferencesError
  const profileUpdate = { display_name: nickname, updated_at: new Date().toISOString() }
  if (completeOnboarding) profileUpdate.onboarding_completed_at = new Date().toISOString()
  const { error } = await client.from('profiles').update(profileUpdate).eq('id', user.id).select('id').single()
  if (error) throw error
  return loadAccount(client, user)
}
