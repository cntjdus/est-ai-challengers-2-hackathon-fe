import {
  Layers,
  LocateFixed,
  Navigation,
  RefreshCw,
} from 'lucide-react'
import './PackageMapView.css'

export default function PackageMapView({
  stores,
  selectedStoreId,
  onSelect,
  location,
  isLoading,
  onRefresh,
  layers,
  onToggleLayers,
  locationCentered,
  onLocate,
}) {
  return (
    <div
      aria-label="상무지구 주변 매장 지도"
      className={`package-map absolute inset-0 overflow-hidden ${
        layers
          ? 'package-map--layers'
          : ''
      }`}
    >
      <img
        src="/maps/sangmu-package-map.png"
        alt=""
        aria-hidden="true"
        className="package-map-image absolute inset-0 size-full object-fill"
      />

      <div
        aria-hidden="true"
        className="package-map-overlay absolute inset-0"
      />

      <div className="absolute inset-x-0 top-4 z-20 flex justify-center">
        <button
          type="button"
          disabled={isLoading}
          onClick={onRefresh}
          className="flex min-h-9 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm text-[#007f5c] shadow-md disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden="true"
            className={`size-4 ${
              isLoading
                ? 'animate-spin motion-reduce:animate-none'
                : ''
            }`}
          />

          {isLoading
            ? '매장 검색 중'
            : '이 지역 재검색'}
        </button>
      </div>

      <div className="absolute top-40 right-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          aria-label="지도 강조 보기"
          aria-pressed={layers}
          onClick={onToggleLayers}
          className="flex size-10 items-center justify-center rounded-2xl bg-white shadow-md aria-pressed:bg-[#d1fae5]"
        >
          <Layers
            aria-hidden="true"
            className="size-5"
          />
        </button>

        <button
          type="button"
          aria-label="내 위치로 이동"
          aria-pressed={locationCentered}
          onClick={onLocate}
          className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#007f5c] shadow-md"
        >
          <Navigation
            aria-hidden="true"
            className="size-5"
          />
        </button>
      </div>

      <div
        className="absolute inset-0 z-10"
        aria-label="매장 위치"
      >
        {stores.map((store) => (
          <button
            type="button"
            key={store.id}
            data-store-marker={store.id}
            aria-pressed={
              selectedStoreId ===
              store.id
            }
            aria-label={`${store.name} ${store.price.toLocaleString('ko-KR')}원 재고 ${store.stock}개`}
            onClick={() =>
              onSelect(store.id)
            }
            style={{
              left: `${store.mapPosition.x}%`,
              top: `${store.mapPosition.y}%`,
            }}
            className={`package-store-marker absolute w-max min-w-[105px] max-w-[52%] -translate-x-1/2 -translate-y-full rounded-2xl px-2.5 py-2 text-center shadow-lg transition-colors motion-reduce:transition-none ${
              selectedStoreId === store.id
                ? 'z-20 bg-[#007451] text-white ring-4 ring-[#007451]/20'
                : 'z-10 bg-white/95 text-[#161c25]'
            }`}
          >
            <span className="block text-[10px] leading-4">
              {store.name}
            </span>

            <span className="mt-1 flex flex-wrap items-center justify-center gap-1">
              <strong
                className={
                  selectedStoreId ===
                  store.id
                    ? 'text-lg'
                    : 'text-sm'
                }
              >
                {store.price.toLocaleString(
                  'ko-KR',
                )}
                원
              </strong>

              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] ${
                  selectedStoreId ===
                  store.id
                    ? 'bg-white text-[#007451]'
                    : store.stock <= 2
                      ? 'bg-[#ffe4e6] text-[#e11d48]'
                      : 'bg-[#e5f1ed] text-[#007451]'
                }`}
              >
                {store.stock > 0
                  ? `재고 ${store.stock}개`
                  : '품절'}
              </span>
            </span>
          </button>
        ))}

        <div
          aria-label="기준 위치"
          style={{
            left: `${location.mapPosition.x}%`,
            top: `${location.mapPosition.y}%`,
          }}
          className="absolute -translate-x-1/2"
        >
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#006b7b] px-2 py-0.5 text-[10px] text-white">
            기준 위치
          </span>

          <span
            className={`block size-4 rounded-full border-[3px] border-white bg-[#10b981] shadow-md ring-4 ring-[#10b981]/20 ${
              locationCentered
                ? 'outline-8 outline-[#10b981]/10'
                : ''
            }`}
          />
        </div>
      </div>

      <p className="absolute bottom-3 left-3 z-20 flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[9px] text-[#64748b] shadow-sm">
        <LocateFixed
          aria-hidden="true"
          className="size-3"
        />
        상무지구 지도·상품·재고 정보는
        시연용 데이터입니다.
      </p>
    </div>
  )
}
