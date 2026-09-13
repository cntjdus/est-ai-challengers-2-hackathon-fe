import { recipes } from './recipes'

// 상품·재고·배송·위치 정보는 API 연결 전 화면 확인용 Mock 데이터입니다.
const channels = [
  { id: 'market', channelType: 'offline', storeName: '이마트 에브리데이 역삼점', locationText: '도보 7분 · 픽업 가능', badges: [], description: '손질 완료 · 필요한 만큼 간편하게 사용', analysisText: '다음 한 끼에 활용' },
  { id: 'delivery', channelType: 'delivery', storeName: '마켓컬리 샛별배송', locationText: '내일 아침 도착', badges: [{ text: '새벽배송 07시 전 도착', tone: 'blue' }], description: '1인 가구 전용 소포장 구성', analysisText: '필요한 양에 가깝게 구매' },
  { id: 'nearby', channelType: 'offline', storeName: 'GS 더프레시 역삼역점', locationText: '도보 12분', badges: [{ text: '매장 재고 4개 남음', tone: 'orange' }, { text: '즉시 픽업', tone: 'gray' }], description: '찌개와 볶음에 바로 사용하는 재료', analysisText: '다음 요리에 나눠 사용' },
  { id: 'local', channelType: 'local', storeName: '동네 로컬 푸드 마켓', locationText: '도보 9분', badges: [{ text: '푸드리큐브', tone: 'green' }, { text: '40% 알뜰 할인', tone: 'orange' }], description: '소포장으로 음식물 낭비를 줄이는 상품', analysisText: '남은 양을 소분해 활용' },
]
const catalog = {
  'green-onion': [
    { amount: 100, name: '컷팅 대파 소포장 알뜰팩' }, { amount: 80, name: '마켓컬리 한끼 깐대파' },
    { amount: 120, name: 'GS 더프레시 신선 어슷썰기 대파' }, { amount: 150, name: '어글리러스 못난이 조각 대파' },
  ],
  tofu: [
    { amount: 300, name: '한끼 두부 알뜰팩' }, { amount: 150, name: '소포장 부드러운 두부' },
    { amount: 200, name: '찌개용 두부 미니팩' }, { amount: 100, name: '한입 두부 소포장' },
  ],
  egg: [
    { amount: 2, name: '신선한 계란 2구' }, { amount: 4, name: '한끼 계란 4구' },
    { amount: 6, name: '알뜰 계란 6구' }, { amount: 3, name: '로컬 계란 3구' },
  ],
}
export const packageLocation = { label: '내 위치 기준 1.5km 이내', isMock: true }
export const packageFilters = [{ id: 'all', label: '전체' }, { id: 'offline', label: '주변 오프라인 매장' }, { id: 'delivery', label: '새벽·당일 배송' }]
export function calculatePackageWaste(amount, required) {
  const total = Number.isFinite(amount) ? Math.max(0, amount) : 0
  const need = Number.isFinite(required) ? Math.max(0, required) : 0
  const remaining = Math.max(0, total - need)
  return { total, required: need, remaining, shortage: Math.max(0, need - total), wasteRate: total ? Math.round(remaining / total * 100) : 0, requiredPercent: total ? Math.min(100, need / total * 100) : 0 }
}
export function getPackageOptions(item) {
  if (!item) return []
  return (catalog[item.ingredientId] ?? []).map((option, index) => ({
    ...channels[index], ...option, id: item.ingredientId + '-' + channels[index].id,
    ingredientId: item.ingredientId, unit: item.amountUnit, image: null,
  }))
}
export function getRecommendedProduct(products, requiredAmount) {
  const enough = products.filter((product) => product.amount >= requiredAmount)
  // 바로 픽업 가능한 최소 용량을 우선하고, 없으면 전체 채널에서 선택합니다.
  const pickup = enough.filter((product) => product.channelType === 'offline')
  return [...(pickup.length ? pickup : enough)].sort((a, b) => a.amount - b.amount)[0] ?? null
}
export function replaceCartItem(original, product) {
  if (product.ingredientId !== original.ingredientId || product.unit !== original.amountUnit || product.amount <= 0 || original.packageAmount <= 0) throw new Error('교체할 상품 정보를 확인해주세요.')
  const ingredientName = recipes.flatMap((recipe) => recipe.ingredients).find((entry) => entry.id === original.ingredientId)?.name ?? original.shortName
  const analysis = calculatePackageWaste(product.amount, original.plannedUsage)
  return {
    ...original, productId: product.id, name: product.name + ' (' + product.amount + product.unit + ')',
    shortName: ingredientName + ' 소포장', image: product.image, packageAmount: product.amount,
    inventoryQuantity: original.inventoryQuantity * product.amount / original.packageAmount,
    quantity: 1, storageLabel: product.storeName,
    riskLevel: analysis.wasteRate >= 50 ? 'warning' : 'normal', stockRisk: analysis.wasteRate >= 50 ? '소진 위험' : '활용 가능',
  }
}
