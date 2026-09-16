export const expectedRemaining = (item) => Number(Math.max(0, item.packageAmount * item.quantity - item.plannedUsage).toFixed(4))
export const relatedRecipeNames = (item) => item.recipeTitles ?? []
export const optimizationCopy = {
  badge: '1인 가구 솔루션', title: '구매 전 용량 주의 알림',
  action: '소포장·냉동소분 최적화 솔루션 보기',
}
