import { getPackageOptions, packageLocation } from './packageOptions'
import { recipes } from './recipes'

// Mock adapters: replace these functions with location / nearby-store / inventory APIs.
export const getCurrentLocation = () => ({ ...packageLocation })
export function getNearbyStores(item, location = getCurrentLocation()) {
  return getPackageOptions(item).filter((product) => product.channelType !== 'delivery' && product.distance <= location.searchRadius * 1000).map((product) => ({
    ...product, id: product.id, name: product.storeName, product,
  }))
}
export function getDefaultRecommendedStore(stores, selectedProductId) {
  const available = stores.filter((store) => store.stock > 0)
  return available.find((store) => store.product.id === selectedProductId) ?? [...available].sort((a, b) => a.distance - b.distance || a.price - b.price)[0] ?? stores[0] ?? null
}
export function getIngredientName(item) {
  return recipes.flatMap((recipe) => recipe.ingredients).find((ingredient) => ingredient.id === item?.ingredientId)?.name ?? item?.shortName ?? '식재료'
}
export function getStoreInventory(item, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('검색 취소', 'AbortError')) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve({ stores: getNearbyStores(item), checkedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) }) }, 450)
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
}
export const getDirectionsPreview = (store) => store.name + '까지 도보 ' + store.walkingMinutes + '분 (' + store.distance + 'm) · 실제 길찾기 연결은 준비 중입니다.'
