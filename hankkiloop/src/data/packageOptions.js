export const packageLocation = {
  label: '상무지구 기준 1.5km 이내',
  regionName: '광주 상무지구',
  searchRadius: 1.5,
  mapPosition: { x: 33, y: 91 },
  isMock: true,
}

export const packageFilters = [
  { id: 'all', label: '전체' },
  { id: 'offline', label: '주변 오프라인 매장' },
  { id: 'delivery', label: '새벽·당일 배송' },
]

export function calculatePackageWaste(amount, required) {
  const total = Number.isFinite(Number(amount)) ? Math.max(0, Number(amount)) : 0
  const need = Number.isFinite(Number(required)) ? Math.max(0, Number(required)) : 0
  const remaining = Math.max(0, total - need)

  return {
    total,
    required: need,
    remaining,
    shortage: Math.max(0, need - total),
    wasteRate: total ? Math.round((remaining / total) * 100) : 0,
    requiredPercent: total ? Math.min(100, (need / total) * 100) : 0,
  }
}

export function getRecommendedProduct(products, requiredAmount) {
  const available = products.filter((product) => Number(product.stock ?? 1) > 0)
  const enough = available.filter((product) => product.amount >= requiredAmount)
  const candidates = enough.length ? enough : available

  // 바로 픽업 가능한 오프라인/하이브리드 매장을 우선합니다.
  const pickup = candidates.filter((product) =>
    ['offline', 'hybrid', 'local'].includes(product.channelType),
  )

  return [...(pickup.length ? pickup : candidates)].sort(
    (a, b) => a.amount - b.amount || a.price - b.price,
  )[0] ?? null
}
