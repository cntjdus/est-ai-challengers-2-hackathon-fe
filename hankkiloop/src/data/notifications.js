import { getDaysUntilExpiry, expiryLabel } from './inventory'

export function getNotificationCategoryByDaysLeft(daysLeft) {
  if (!Number.isFinite(daysLeft)) return null
  if (daysLeft <= 5) return 'expiry'
  if (daysLeft <= 10) return 'coach'
  return null
}
export function createExpiryNotifications(fridgeItems, now = new Date()) {
  return fridgeItems.flatMap((item, index) => {
    const daysLeft = getDaysUntilExpiry(item.expiryDate, now)
    const category = getNotificationCategoryByDaysLeft(daysLeft)
    if (!category) return []
    return [{
      id: 'inventory:' + item.id + ':' + item.expiryDate + ':' + category,
      category, ingredientName: item.name, daysLeft,
      badge: category === 'coach' ? '냉큼이의 한마디' : daysLeft < 0 ? '소비기한 지남' : daysLeft === 0 ? '오늘까지 D-DAY' : daysLeft === 1 ? '소비기한 내일 D-1' : '소비 권장 ' + expiryLabel(daysLeft),
      title: category === 'coach' ? item.name + ' 잊으신 건 아니죠?' : item.name + ' ' + item.amount + item.unit + ' · ' + expiryLabel(daysLeft),
      description: category === 'coach' ? '소비기한까지 ' + daysLeft + '일 남았어요. ' + item.storageTip : daysLeft < 0 ? '소비기한이 지난 재료예요. 제품에 표시된 안내와 보관 상태를 확인해주세요.' : '냉장고에 보관 중인 재료예요. 오늘의 요리에 활용할 레시피를 확인해보세요.',
      icon: category === 'coach' ? 'sprout' : item.storageType === 'freezer' ? 'snowflake' : 'leaf',
      action: category === 'coach' ? { type: 'fridge' } : { type: 'ingredient-recipes', ingredient: item.name },
      createdAt: new Date(now.getTime() - (category === 'coach' ? 1440 : 10 + index * 50) * 60000).toISOString(),
    }]
  })
}
export function createMenuNotifications(inventory, now = new Date(), recipes = []) {
  // Demo recommendation references; recipe titles and quantities stay in the existing recipe data.
  return recipes.slice(0, 2).flatMap((recipe, index) => {
    const id = recipe.id
    if (!recipe) return []
    return [{
      id: 'menu:' + id + ':' + now.toLocaleDateString('en-CA'),
      category: 'menu', mealType: index ? 'dinner' : 'lunch', icon: index ? 'moon' : 'sun',
      badge: index ? '오늘의 저메추' : '오늘의 점메추', title: recipe.title,
      description: recipe.ingredientSummary + '로 간단한 한 끼를 준비해보세요.',
      ingredientsMatched: recipe.ingredients.filter((item) => (inventory[item.id] ?? 0) > 0).length,
      ingredientCount: recipe.ingredients.length, cookTime: recipe.minutes,
      action: { type: 'recipe', recipeId: id },
      createdAt: new Date(now.getTime() - (index ? 90 : 180) * 60000).toISOString(),
    }]
  })
}
export function formatNotificationTime(createdAt, now = new Date()) {
  const time = new Date(createdAt)
  if (!Number.isFinite(time.getTime())) return ''
  const minutes = Math.max(0, Math.floor((now - time) / 60000))
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return minutes + '분 전'
  if (minutes < 1440) return Math.floor(minutes / 60) + '시간 전'
  if (minutes < 2880) return '어제'
  return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(time)
}
// Replace these local updates with backend read acknowledgements when the contract is ready.
export const markNotificationAsRead = (readIds, id) => readIds.includes(id) ? readIds : [...readIds, id]
export const markAllNotificationsAsRead = (readIds, notifications) => [...new Set([...readIds, ...notifications.map((item) => item.id)])]
