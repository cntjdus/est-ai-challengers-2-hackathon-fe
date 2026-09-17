import { loadPackageOptions, packageLocation } from './packageApi'

export const getCurrentLocation = () => ({ ...packageLocation })

export function getNearbyStoresFromProducts(
  products,
  location = getCurrentLocation(),
) {
  return products
    .filter(
      (product) =>
        product.channelType !== 'delivery' &&
        (!product.distance ||
          product.distance <= location.searchRadius * 1000),
    )
    .map((product) => ({
      ...product,
      id: product.id,
      name: product.storeName,
      product,
    }))
}

export function getDefaultRecommendedStore(
  stores,
  selectedProductId,
) {
  const available = stores.filter((store) => store.stock > 0)

  return (
    available.find(
      (store) => store.product.id === selectedProductId,
    ) ??
    [...available].sort(
      (a, b) =>
        a.distance - b.distance ||
        a.price - b.price,
    )[0] ??
    stores[0] ??
    null
  )
}

export function getIngredientName(item) {
  return (
    item?.shortName?.replace(/\s*소포장$/, '') ??
    item?.name?.replace(/\s*\([^)]*\)\s*$/, '') ??
    '식재료'
  )
}

export async function getStoreInventory(
  client,
  item,
  signal,
) {
  const result = await loadPackageOptions(
    client,
    item,
    { signal },
  )

  return {
    stores: getNearbyStoresFromProducts(result.products),
    warning: result.warning,
    isFallback: result.isFallback,
    checkedAt: new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }
}

export const getDirectionsPreview = (store) =>
  `${store.name}까지 도보 ${store.walkingMinutes}분 (${store.distance}m) · 실제 길찾기 연결은 준비 중입니다.`
