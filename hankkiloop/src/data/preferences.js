import { blankPreferences } from '../utils/preferenceDraft.js'

// Never preselect sample exclusions or dietary tags for a real account.
export const defaultPreferences = blankPreferences
export const householdLabels = { single: '1인 가구' }
export const cookingLabels = { '0': '주 0회 요리', '1-2': '주 1~2회 요리', '3-4': '주 3~4회 요리', '5+': '주 5회 이상 요리' }
