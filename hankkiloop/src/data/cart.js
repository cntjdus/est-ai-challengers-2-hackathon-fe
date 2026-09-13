import { recipes } from './recipes'

// 상품 용량·주간 사용량은 화면 확인용 Mock 값입니다.
// inventoryQuantity는 기존 냉장고 단위(대/모/개) 기준 한 상품의 입고량입니다.
export const initialCartItems = [
  { id: 'cart-green-onion', ingredientId: 'green-onion', name: '싱싱 대파 1단', shortName: '대파 1단', image: null, quantity: 1, selected: true, storageLabel: '신선 채소관', storageType: '냉장 보관', packageAmount: 300, amountUnit: 'g', plannedUsage: 60, inventoryQuantity: 3, relatedRecipeIds: ['pork', 'tofu'], riskLevel: 'warning', stockRisk: '소진 위험' },
  { id: 'cart-tofu', ingredientId: 'tofu', name: '부드러운 두부 1모', shortName: '두부 1모', image: null, quantity: 1, selected: true, storageLabel: '냉장 식품관', storageType: '냉장 보관', packageAmount: 300, amountUnit: 'g', plannedUsage: 300, inventoryQuantity: 1, relatedRecipeIds: ['stew', 'tofu'], riskLevel: 'normal', stockRisk: '활용 가능' },
  { id: 'cart-eggs', ingredientId: 'egg', name: '신선한 계란 6구', shortName: '계란 6구', image: null, quantity: 1, selected: true, storageLabel: '신선 식품관', storageType: '냉장 보관', packageAmount: 6, amountUnit: '개', plannedUsage: 2, inventoryQuantity: 6, relatedRecipeIds: ['tofu'], riskLevel: 'normal', stockRisk: '활용 가능' },
]
export const expectedRemaining = (item) => Math.max(0, item.packageAmount * item.quantity - item.plannedUsage)
export const relatedRecipeNames = (item) => item.relatedRecipeIds.map((id) => recipes.find((recipe) => recipe.id === id)?.title).filter(Boolean)
export const optimizationCopy = {
  badge: '1인 가구 솔루션', title: '구매 전 용량 주의 알림',
  action: '소포장·냉동소분 최적화 솔루션 보기',
}
