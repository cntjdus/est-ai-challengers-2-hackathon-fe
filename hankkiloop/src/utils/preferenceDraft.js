export const blankPreferences = { householdType: 'single', cookingFrequency: '3-4', dietStyles: [], excludedIngredients: [], allergies: [] }

export function normalizeTags(tags) {
  if (!Array.isArray(tags) || tags.length > 50 || tags.some(tag => typeof tag !== 'string' || Array.from(tag.trim()).length > 50)) {
    throw new Error('식단 태그는 각 50자 이내, 최대 50개까지 입력해주세요.')
  }
  return [...new Set(tags.map(tag => tag.trim()).filter(Boolean))]
}

export function appendTag(tags, input, stripHash = false) {
  const value = (stripHash ? input.trim().replace(/^#+\s*/, '') : input).trim()
  return value && !tags.includes(value) ? [...tags, value] : [...tags]
}

// Include text that has not yet been submitted with Enter or the add button.
export function collectPreferenceDraft(preferences, inputs = {}) {
  return {
    ...preferences, householdType: 'single',
    dietStyles: normalizeTags(appendTag(preferences.dietStyles ?? [], inputs.dietKeyword ?? '', true)),
    excludedIngredients: normalizeTags(appendTag(preferences.excludedIngredients ?? [], inputs.ingredientInput ?? '')),
    allergies: normalizeTags(appendTag(preferences.allergies ?? [], inputs.allergyInput ?? '')),
  }
}
