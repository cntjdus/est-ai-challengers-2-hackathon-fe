import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ArrowDownUp,
  ChevronRight,
  Map,
  MapPin,
  Refrigerator,
  RefreshCcw,
  X,
} from 'lucide-react'
import EditProfileHeader from '../components/profile/EditProfileHeader'
import ProductOptionCard from '../components/cart/ProductOptionCard'
import {
  calculatePackageWaste,
  getRecommendedProduct,
  packageFilters,
  packageLocation,
} from '../data/packageOptions'
import { loadPackageOptions } from '../data/packageApi'
import { supabase } from '../lib/supabase'

const matchesFilter = (product, filter) => {
  if (filter === 'all') return true

  if (filter === 'offline') {
    return ['offline', 'hybrid', 'local'].includes(
      product.channelType,
    )
  }

  if (filter === 'delivery') {
    return (
      product.dawnDelivery ||
      ['dawn_delivery', 'same_day'].includes(
        product.deliveryType,
      )
    )
  }

  return true
}

export default function PackageSolution({
  item,
  onBack,
  onClose,
  onReplace,
  onOpenMap,
  embedded = false,
}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(Boolean(item))
  const [warning, setWarning] = useState('')

  const [selectedProductId, setSelectedProductId] =
    useState(
      history.state?.packageView?.selectedProductId ??
        null,
    )

  const [filter, setFilter] = useState(
    history.state?.packageView?.filter ?? 'all',
  )

  const [notice, setNotice] = useState('')
  const [replacing, setReplacing] = useState(false)

  const mainRef = useRef(null)

  useEffect(() => {
    if (!item) {
      setProducts([])
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()

    setLoading(true)
    setWarning('')

    loadPackageOptions(
      supabase,
      item,
      { signal: controller.signal },
    )
      .then((result) => {
        if (controller.signal.aborted) return

        setProducts(result.products)
        setWarning(result.warning)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setProducts([])

          setWarning(
            `소포장 상품을 불러오지 못했어요. ${error.message}`,
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [item])

  const recommended = useMemo(
    () =>
      getRecommendedProduct(
        products,
        item?.plannedUsage ?? 0,
      ),
    [products, item?.plannedUsage],
  )

  useEffect(() => {
    if (!products.length) return

    if (
      selectedProductId &&
      products.some(
        (product) =>
          product.id === selectedProductId,
      )
    ) {
      return
    }

    setSelectedProductId(
      recommended?.id ??
        products[0]?.id ??
        null,
    )
  }, [
    products,
    recommended?.id,
    selectedProductId,
  ])

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop =
        history.state?.packageView?.scrollTop ?? 0
    }
  }, [])

  const visibleProducts = products.filter(
    (product) =>
      matchesFilter(product, filter),
  )

  const selectedProduct = products.find(
    (product) =>
      product.id === selectedProductId,
  )

  const analysis = calculatePackageWaste(
    (item?.packageAmount ?? 0) *
      (item?.quantity ?? 1),
    item?.plannedUsage ?? 0,
  )

  const handleFilterChange = (value) => {
    setFilter(value)

    if (
      selectedProduct &&
      !matchesFilter(selectedProduct, value)
    ) {
      setSelectedProductId(null)
    }
  }

  const handleOpenMap = () =>
    onOpenMap({
      selectedProductId:
        selectedProduct?.id ?? null,
      filter,
      scrollTop:
        mainRef.current?.scrollTop ?? 0,
    })

  const handleReplaceCartItem = async () => {
    if (
      !item ||
      !selectedProduct ||
      replacing
    ) {
      return
    }

    setNotice('')

    if (selectedProduct.isDemo) {
      setNotice(
        '현재는 DB 연결 실패 시 표시되는 예시 상품입니다. DB 소포장 상품이 조회되면 실제 교체가 가능합니다.',
      )
      return
    }

    setReplacing(true)

    try {
      await onReplace(
        item.id,
        selectedProduct,
      )
    } catch (error) {
      setNotice(error.message)
    } finally {
      setReplacing(false)
    }
  }

  return (
    <div className={`mx-auto flex ${embedded ? 'h-full' : 'h-dvh'} w-full max-w-app flex-col overflow-hidden bg-white text-[#1e293b]`}>
      <EditProfileHeader
        title="소포장 식재료 찾기"
        subtitle="1인 가구 음식물 쓰레기 ZERO 루프"
        plain
        onBack={onBack}
        action={
          <button
            type="button"
            aria-label="소포장 찾기 닫기"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full"
          >
            <X
              aria-hidden="true"
              className="size-5"
            />
          </button>
        }
      />

      <main
        ref={mainRef}
        aria-label="소포장 상품 비교"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-[#e2e8f0] px-4 pt-3 pb-6"
      >
        {!item ? (
          <div className="py-12 text-center">
            <p className="text-sm">
              분석할 장바구니 상품이 없습니다.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-[#006c49] px-4 py-3 text-sm text-white"
            >
              장바구니로 돌아가기
            </button>
          </div>
        ) : (
          <>
            <section
              aria-label="현재 상품 용량 분석"
              className="rounded-2xl border border-[#cbd8e7] p-4 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] text-[#008768]">
                  <RefreshCcw
                    aria-hidden="true"
                    className="size-5"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="text-[10px] font-semibold text-[#64748b]">
                    현재 레시피 식재료
                  </h2>

                  <p className="mt-1 text-sm font-bold">
                    {item.name}
                  </p>

                  <span className="mt-1 inline-block rounded border border-[#fecaca] bg-[#fff3f3] px-2 py-0.5 text-[10px] font-bold text-[#f43f5e]">
                    낭비 위험{' '}
                    {analysis.wasteRate}%
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-[#7c8595]">
                    실제 필요량
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#007f5c]">
                    {analysis.required}
                    {item.amountUnit}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-[#dbe4ef] pt-3">
                <div className="mb-2 flex flex-wrap justify-between gap-1 text-[10px] font-bold">
                  <span className="text-[#007f5c]">
                    필요량 {analysis.required}
                    {item.amountUnit}
                  </span>

                  <span className="text-[#f43f5e]">
                    잔여 {analysis.remaining}
                    {item.amountUnit} 버려질 위험
                    (구매량 {analysis.total}
                    {item.amountUnit})
                  </span>
                </div>

                <div
                  role="img"
                  aria-label={`필요량 ${Math.round(analysis.requiredPercent)}%, 잔여 ${analysis.wasteRate}%`}
                  className="flex h-3 overflow-hidden rounded-full border border-[#cbd8e7]"
                >
                  <span
                    style={{
                      width: `${analysis.requiredPercent}%`,
                    }}
                    className="bg-[#007f5c]"
                  />

                  <span
                    style={{
                      width: `${100 - analysis.requiredPercent}%`,
                      backgroundImage:
                        'repeating-linear-gradient(45deg,#fda4af 0,#fda4af 6px,#ffe4e6 6px,#ffe4e6 12px)',
                    }}
                  />
                </div>

                {analysis.shortage > 0 && (
                  <p className="mt-2 text-xs text-[#c66b43]">
                    필요량보다{' '}
                    {analysis.shortage}
                    {item.amountUnit} 부족해요.
                  </p>
                )}
              </div>

              <aside className="mt-4 flex items-start gap-2 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#a7f3d0] bg-white text-[#008768]">
                  <Refrigerator
                    aria-hidden="true"
                    className="size-5"
                  />
                </span>

                <p className="text-xs font-semibold leading-5 text-[#008768]">
                  남는 재료 소분이 번거롭다면
                  딱 필요한 만큼만 소포장으로
                  교체해보세요! 음식물 쓰레기를
                  줄일 수 있어요.
                </p>
              </aside>
            </section>

            <section className="mt-5">
              <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                <h2 className="text-[#475569]">
                  구매 채널 필터
                </h2>

                <span className="flex items-center gap-1 text-[#007f5c]">
                  <MapPin
                    aria-hidden="true"
                    className="size-3"
                  />
                  {packageLocation.label}
                </span>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {packageFilters.map(
                  (option) => (
                    <button
                      type="button"
                      key={option.id}
                      aria-pressed={
                        filter === option.id
                      }
                      onClick={() =>
                        handleFilterChange(
                          option.id,
                        )
                      }
                      className="shrink-0 rounded-full border border-[#cbd8e7] px-3 py-2 text-[11px] font-semibold text-[#475569] shadow-xs aria-pressed:border-[#007f5c] aria-pressed:bg-[#007f5c] aria-pressed:text-white"
                    >
                      {option.label}
                      {option.id === 'all'
                        ? ` (${products.length})`
                        : ''}
                    </button>
                  ),
                )}
              </div>
            </section>

            {warning && (
              <p
                role="status"
                className="mt-2 rounded-xl bg-[#fff7ed] px-3 py-2 text-[10px] leading-4 text-[#9a5a2b]"
              >
                {warning}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="py-10 text-center text-sm text-[#7c8595]">
                  소포장 상품을 불러오는 중…
                </p>
              ) : (
                visibleProducts.map(
                  (product) => (
                    <ProductOptionCard
                      key={product.id}
                      product={product}
                      selected={
                        selectedProductId ===
                        product.id
                      }
                      recommended={
                        recommended?.id ===
                        product.id
                      }
                      requiredAmount={
                        analysis.required
                      }
                      originalRemaining={
                        analysis.remaining
                      }
                      onSelect={
                        setSelectedProductId
                      }
                    />
                  ),
                )
              )}

              {!loading &&
                !visibleProducts.length && (
                  <p className="py-10 text-center text-sm text-[#7c8595]">
                    조건에 맞는 소포장
                    상품이 없습니다.
                  </p>
                )}
            </div>

            <section
              aria-label="주변 매장 지도"
              className="mt-4 flex items-center gap-3 rounded-2xl border border-[#cbd8e7] p-4 shadow-xs"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] text-[#008768]">
                <Map
                  aria-hidden="true"
                  className="size-6"
                />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-bold">
                  주변 오프라인 매장 재고 지도
                </h2>

                <p className="mt-1 text-[10px] leading-4 text-[#64748b]">
                  상무지구 소포장 매장
                  위치·재고 확인
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenMap}
                className="flex min-h-9 items-center gap-1 rounded-xl border border-[#cbd8e7] bg-[#f1f5f9] px-2 text-xs text-[#475569]"
              >
                지도
                <ChevronRight
                  aria-hidden="true"
                  className="size-3"
                />
              </button>
            </section>

            <p className="mt-3 text-center text-[9px] text-[#94a3b8]">
              상품·재고·배송·위치 정보는
              해커톤 시연용 데이터입니다.
            </p>
          </>
        )}
      </main>

      <footer className="shrink-0 border-t border-[#e2e8f0] bg-white px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {notice && (
          <p
            role="status"
            className="mb-2 text-xs text-[#64748b]"
          >
            {notice}
          </p>
        )}

        <button
          type="button"
          disabled={
            !selectedProduct ||
            !item ||
            replacing
          }
          onClick={handleReplaceCartItem}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#006c49] px-3 py-3 text-[13px] font-bold text-white shadow-lg disabled:opacity-40"
        >
          <ArrowDownUp
            aria-hidden="true"
            className="size-5 shrink-0"
          />

          {replacing
            ? '장바구니 교체 중…'
            : selectedProduct
              ? `이 소포장(${selectedProduct.amount}${selectedProduct.unit})으로 장바구니 교체하기`
              : '교체할 소포장 상품을 선택해주세요'}
        </button>
      </footer>
    </div>
  )
}
