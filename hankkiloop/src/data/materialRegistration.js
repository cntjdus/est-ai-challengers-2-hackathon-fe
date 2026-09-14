import { recipes } from './recipes'
export const storageOptions = [
  { id: 'fridge', label: '냉장', days: 7, note: '권장 7일', icon: 'fridge' },
  { id: 'freezer', label: '냉동', days: 30, note: '권장 30일', icon: 'freezer', recommended: true },
  { id: 'room', label: '실온', days: 1, note: '보관 비권장', icon: 'room' },
]
export const solutionOptions = [
  { id: 'small', title: '소포장 찾기', description: '주변 매장 소포장 상품', highlight: '필요한 양만 구매하기', footer: '낭비 방지' },
  { id: 'freeze', title: '냉동 소분 가이드', description: '한 번 사용할 양씩 분할 포장', highlight: '냉동 소분 보관 가이드', footer: '추천 방법' },
]
// UI 확인용 Mock 정책이며 품목별 실제 소비기한을 보장하지 않습니다.
export const storageGuides = {
  fridge: '냉장 보관할 재료는 밀폐하여 보관하고 제품 포장에 표시된 보관 방법과 소비기한을 먼저 확인해주세요.',
  freezer: '냉동 가능한 재료인지 확인하고 한 번 사용할 분량씩 소분해 밀폐해주세요. 포장에 표시된 보관 방법과 소비기한을 우선해주세요.',
  room: '실온 보관이 가능한 제품인지 포장 표시를 확인해주세요. 냉장·냉동 제품은 실온 보관을 권장하지 않아요.',
}
export function localDate(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
export function calculateExpiryDate(storageType, purchaseDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) return ''
  const date = new Date(purchaseDate + 'T12:00:00')
  const policy = storageOptions.find((item) => item.id === storageType)
  if (!policy || !Number.isFinite(date.getTime()) || localDate(date) !== purchaseDate) return ''
  date.setDate(date.getDate() + policy.days)
  return localDate(date)
}
export function createRegistrationDraft(items) {
  const today = localDate()
  return items.map((item) => {
    const ingredient = recipes.flatMap((recipe) => recipe.ingredients).find((entry) => entry.id === item.ingredientId)
    return {
      id: item.id, ingredientId: item.ingredientId, ingredientName: ingredient?.name ?? item.shortName,
      purchaseAmount: String(item.packageAmount * item.quantity), unit: item.amountUnit,
      inventoryPerUnit: item.inventoryQuantity / item.packageAmount, storageType: 'freezer',
      purchaseDate: today, expiryDate: calculateExpiryDate('freezer', today), expiryAutomatic: true,
      storageGuide: storageGuides.freezer, recognizedFromPhoto: false,
    }
  })
}
export function validateMaterial(material) {
  if (!material.ingredientName.trim()) return '식재료 이름을 입력해주세요.'
  if (!material.purchaseAmount || !Number.isFinite(Number(material.purchaseAmount)) || Number(material.purchaseAmount) <= 0) return '구매량을 0보다 큰 숫자로 입력해주세요.'
  if (!storageOptions.some((option) => option.id === material.storageType)) return '보관장소를 선택해주세요.'
  if (!calculateExpiryDate(material.storageType, material.purchaseDate)) return '올바른 구매일을 입력해주세요.'
  if (!calculateExpiryDate(material.storageType, material.expiryDate)) return '올바른 소비기한을 입력해주세요.'
  if (material.expiryDate < material.purchaseDate) return '소비기한은 구매일보다 빠를 수 없어요.'
  return ''
}
export function registerMaterials(inventory, materials) {
  const next = { ...inventory }
  for (const material of materials) {
    const error = validateMaterial(material)
    if (error) throw new Error(error)
    next[material.ingredientId] = Number(((next[material.ingredientId] ?? 0) + Number(material.purchaseAmount) * material.inventoryPerUnit).toFixed(3))
  }
  return next
}

export function createDirectRegistrationDraft() {
  const id = 'direct-' + crypto.randomUUID()
  const today = localDate()
  return [{ id, ingredientId: id, ingredientName: '', purchaseAmount: '', unit: 'g', inventoryPerUnit: 1,
    storageType: 'fridge', purchaseDate: today, expiryDate: calculateExpiryDate('fridge', today),
    expiryAutomatic: true, storageGuide: storageGuides.fridge, recognizedFromPhoto: false, direct: true }]
}
