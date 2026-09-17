import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Footprints,
  Image as ImageIcon,
  LocateFixed,
  RefreshCw,
  Sprout,
  Store,
  X,
} from 'lucide-react'
import EditProfileHeader from '../components/profile/EditProfileHeader'
import BottomSheet from '../components/common/BottomSheet'
import PackageMapView from '../components/cart/PackageMapView'
import {
  getCurrentLocation,
  getDefaultRecommendedStore,
  getIngredientName,
  getStoreInventory,
  getDirectionsPreview,
} from '../data/packageMap'
import { supabase } from '../lib/supabase'

const sheetSnapPoints = [0.2, 0.34, 0.7]

export default function PackageMap({
  item,
  selectedProductId,
  onBack,
  onReplace,
  embedded = false,
}) {
  const [location] = useState(
    getCurrentLocation,
  )

  const [stores, setStores] = useState([])

  const [
    selectedStoreId,
    setSelectedStoreId,
  ] = useState(
    history.state?.selectedStoreId ?? null,
  )

  const [checkedAt, setCheckedAt] =
    useState('')

  const [refreshKey, setRefreshKey] =
    useState(0)

  const [isLoading, setLoading] =
    useState(Boolean(item))

  const [layers, setLayers] =
    useState(false)

  const [
    locationCentered,
    setLocationCentered,
  ] = useState(false)

  const [notice, setNotice] =
    useState('')

  const [replacing, setReplacing] =
    useState(false)

  const selectedStore = useMemo(
    () =>
      stores.find(
        (store) =>
          store.id === selectedStoreId,
      ) ??
      getDefaultRecommendedStore(
        stores,
        selectedProductId,
      ),
    [
      stores,
      selectedStoreId,
      selectedProductId,
    ],
  )

  const targetProduct =
    stores.find(
      (store) =>
        store.product.id ===
        selectedProductId,
    )?.product ??
    selectedStore?.product

  useEffect(() => {
    if (!item) return undefined

    const controller =
      new AbortController()

    setLoading(true)
    setNotice('')

    getStoreInventory(
      supabase,
      item,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) {
          return
        }

        setStores(result.stores)
        setCheckedAt(result.checkedAt)

        const next =
          result.stores.find(
            (store) =>
              store.id ===
              selectedStoreId,
          ) ??
          getDefaultRecommendedStore(
            result.stores,
            selectedProductId,
          )

        setSelectedStoreId(
          next?.id ?? null,
        )

        if (result.warning) {
          setNotice(result.warning)
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setNotice(
            '매장 정보를 불러오지 못했어요. 다시 검색해주세요.',
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [
    item,
    refreshKey,
    selectedProductId,
  ])

  useEffect(() => {
    history.replaceState(
      {
        ...history.state,
        selectedStoreId,
      },
      '',
      window.location.href,
    )
  }, [selectedStoreId])

  const handleRefreshStores = () => {
    setLoading(true)
    setNotice('')
    setRefreshKey(
      (key) => key + 1,
    )
  }

  const handleSelectStore = (id) => {
    setSelectedStoreId(id)
    setNotice('')
  }

  const handleOpenDirections = () => {
    if (selectedStore) {
      setNotice(
        getDirectionsPreview(
          selectedStore,
        ),
      )
    }
  }

  const handleAddToCart = async () => {
    if (
      !selectedStore ||
      selectedStore.stock <= 0 ||
      replacing
    ) {
      return
    }

    if (selectedStore.product.isDemo) {
      setNotice(
        '현재는 DB 연결 실패 시 표시되는 예시 상품입니다. 실제 DB 상품이 조회되면 장바구니 교체가 가능합니다.',
      )
      return
    }

    setReplacing(true)
    setNotice('')

    try {
      await onReplace(
        item.id,
        selectedStore.product,
      )
    } catch (error) {
      setNotice(error.message)
    } finally {
      setReplacing(false)
    }
  }

  return (
    <div className={`relative mx-auto flex ${embedded ? 'h-full' : 'h-dvh'} w-full max-w-app flex-col overflow-hidden bg-white text-[#161c25]`}>
      <EditProfileHeader
        title="주변 소포장 지도"
        subtitle={
          <span className="rounded-full bg-[#e5f1ed] px-2 py-0.5 text-[#007451]">
            DB 재고
          </span>
        }
        plain
        showNotifications={false}
        onBack={onBack}
        action={
          <>
            <button
              type="button"
              aria-label="주변 매장 새로고침"
              disabled={isLoading}
              onClick={
                handleRefreshStores
              }
              className="flex size-9 items-center justify-center rounded-full text-[#53635a] disabled:opacity-40"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-5 ${
                  isLoading
                    ? 'animate-spin motion-reduce:animate-none'
                    : ''
                }`}
              />
            </button>

            <button
              type="button"
              aria-label="소포장 지도 닫기"
              onClick={onBack}
              className="flex size-9 items-center justify-center rounded-full"
            >
              <X
                aria-hidden="true"
                className="size-5"
              />
            </button>
          </>
        }
      />

      {!item ? (
        <main className="p-8 text-center">
          <p className="text-sm">
            지도에서 확인할 상품을
            먼저 선택해주세요.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-5 rounded-xl bg-[#006c49] px-4 py-3 text-sm text-white"
          >
            소포장 식재료 찾기로
            돌아가기
          </button>
        </main>
      ) : (
        <>
          <section
            aria-label="소포장 검색 정보"
            className="shrink-0 border-b border-[#edf1f7] px-5 pt-2 pb-4"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-[#eef2ff] p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#007451] shadow-xs">
                <Sprout
                  aria-hidden="true"
                  className="size-5"
                />
              </span>

              <div className="min-w-0">
                <h2 className="text-sm font-bold">
                  {getIngredientName(item)}{' '}
                  소포장{' '}
                  {targetProduct &&
                    `(${targetProduct.amount}${targetProduct.unit} 내외)`}{' '}
                  <span className="rounded bg-[#f2e4d9] px-1 text-[10px] font-normal text-[#a34c0c]">
                    1인분
                  </span>
                </h2>

                <p className="mt-1 flex items-start gap-1 text-[11px] font-semibold text-[#53635a]">
                  <LocateFixed
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-[#007451]"
                  />
                  {location.regionName} 반경{' '}
                  {location.searchRadius}km
                  · 주변 매장{' '}
                  {stores.length}곳
                </p>

                <p className="mt-0.5 text-[10px] text-[#64748b]">
                  필요량{' '}
                  {item.plannedUsage}
                  {item.amountUnit}
                </p>
              </div>
            </div>
          </section>

          <main className="relative min-h-0 flex-1 overflow-hidden bg-[#f5f7ff]">
            <PackageMapView
              stores={stores}
              selectedStoreId={
                selectedStore?.id
              }
              onSelect={
                handleSelectStore
              }
              location={location}
              isLoading={isLoading}
              onRefresh={
                handleRefreshStores
              }
              layers={layers}
              onToggleLayers={() =>
                setLayers(
                  (value) =>
                    !value,
                )
              }
              locationCentered={
                locationCentered
              }
              onLocate={() => {
                setLocationCentered(true)
                setNotice(
                  '상무지구 기준 위치를 표시했어요.',
                )
              }}
            />

            {!isLoading &&
              !stores.length && (
                <p className="absolute inset-x-4 top-28 z-20 rounded-xl bg-white p-4 text-center text-sm shadow-sm">
                  이 재료를 취급하는
                  주변 소포장 매장이
                  없습니다.
                </p>
              )}
          </main>

          {selectedStore && (
            <BottomSheet
              modal={false}
              dismissible={false}
              label="매장 상세"
              initialHeight={0.34}
              snapPoints={
                sheetSnapPoints
              }
              maxHeightRatio={0.75}
              contentClassName="px-5 pb-3"
              header={
                <div className="flex items-center justify-between gap-2 px-5 pb-2">
                  <h2 className="min-w-0 text-lg font-semibold leading-6">
                    {selectedStore.name}
                  </h2>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-lg bg-[#e9eefb] px-2 py-1 text-center text-[10px] font-semibold text-[#53635a]">
                      도보{' '}
                      {
                        selectedStore.walkingMinutes
                      }
                      분
                      <br />(
                      {
                        selectedStore.distance
                      }
                      m)
                    </span>

                    <Store
                      aria-hidden="true"
                      className="size-5 text-[#53635a]"
                    />
                  </div>
                </div>
              }
              footer={
                <footer className="shrink-0 bg-white px-5 pt-2 pb-[max(16px,env(safe-area-inset-bottom))]">
                  {notice && (
                    <p
                      role="status"
                      className="mb-2 text-[11px] leading-4 text-[#53635a]"
                    >
                      {notice}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={
                        handleOpenDirections
                      }
                      className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-2xl bg-[#e9eefb] px-2 text-sm"
                    >
                      <Footprints
                        aria-hidden="true"
                        className="size-4"
                      />
                      길찾기
                    </button>

                    <button
                      type="button"
                      disabled={
                        selectedStore.stock <=
                          0 ||
                        isLoading ||
                        replacing
                      }
                      onClick={
                        handleAddToCart
                      }
                      className="min-h-12 flex-[1.7] rounded-2xl bg-[#006c49] px-2 text-xs font-bold text-white shadow-md disabled:opacity-40"
                    >
                      {replacing
                        ? '장바구니 교체 중…'
                        : '이 상품으로 장바구니 담기'}
                    </button>
                  </div>
                </footer>
              }
            >
              <div className="mb-3 flex flex-wrap justify-between gap-1 text-[11px] leading-5 text-[#53635a]">
                <p>
                  <span className="text-[#007451]">
                    ●{' '}
                    {
                      selectedStore.openStatus
                    }
                  </span>{' '}
                  ·{' '}
                  {
                    selectedStore.closingTime
                  }{' '}
                  마감
                </p>

                <p role="status">
                  {isLoading
                    ? '재고 확인 중…'
                    : `재고 ${selectedStore.stock}개 (${checkedAt} 확인)`}
                </p>
              </div>

              <article
                aria-label="선택 매장 상품"
                className="flex items-center gap-3 rounded-2xl bg-[#eef2ff] p-3"
              >
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {selectedStore.product
                    .image ? (
                    <img
                      src={
                        selectedStore
                          .product
                          .image
                      }
                      alt={
                        selectedStore
                          .product
                          .name
                      }
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon
                      aria-hidden="true"
                      className="size-6 text-[#94a3b8]"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-medium leading-5">
                    {
                      selectedStore
                        .product.name
                    }
                  </h3>

                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded bg-[#d1e7e2] px-1 text-[9px] text-[#007451]">
                      1인 가구 추천
                    </span>

                    {selectedStore.dawnDelivery && (
                      <span className="rounded bg-[#e0f2fe] px-1 text-[9px] text-[#0284c7]">
                        새벽배송 가능
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-[#53635a]">
                    {
                      selectedStore
                        .product.amount
                    }
                    {
                      selectedStore
                        .product.unit
                    }{' '}
                    소포장
                  </p>

                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    <strong className="text-xl text-[#007451]">
                      {selectedStore.price.toLocaleString(
                        'ko-KR',
                      )}
                      원
                    </strong>

                    <del className="text-[10px] text-[#7b887f]">
                      {selectedStore.originalPrice.toLocaleString(
                        'ko-KR',
                      )}
                      원
                    </del>
                  </p>
                </div>
              </article>
            </BottomSheet>
          )}
        </>
      )}
    </div>
  )
}
