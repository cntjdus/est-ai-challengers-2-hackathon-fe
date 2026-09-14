import { Image, Utensils, Snowflake } from 'lucide-react'
import { expiryLabel, storageLabels, statusVariants } from '../../data/inventory'

export default function FridgeItemCard({ item, urgent = false, onOpen }) {
  const status = statusVariants[item.status]
  return <article className="relative rounded-2xl border border-[#f1f4ef] bg-white p-4 shadow-xs">
    <div className="flex items-start gap-3">
      <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f0f4f0] ${urgent ? 'size-[70px]' : 'size-12'}`}>
        {item.image ? <img src={item.image} alt={item.name} className="size-full object-cover" /> : <Image aria-label="재료 사진 영역" className="size-6 text-[#9aaea2]" />}
        {urgent && <span className="absolute right-1 bottom-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] text-white">{storageLabels[item.storageType]}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-1.5">
          <h3 className={`min-w-0 break-words leading-5 ${urgent ? 'text-[15px] font-bold' : 'text-sm'}`}><a href={`/fridge/${encodeURIComponent(item.id)}`} onClick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onOpen(item.id) } }} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-[#007f5c]">{item.name}</a></h3>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
            {item.status === 'frozen' && <Snowflake aria-hidden="true" className="size-3" />}{urgent ? expiryLabel(item.daysLeft) + (item.daysLeft > 0 ? ' 소비 임박' : '') : status.label}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-[#78867e]">{urgent ? '남은 양: ' : ''}{item.amount}{item.unit}{urgent ? ' · 보관 ' + item.storedDays + '일째' : ' 남음 · ' + storageLabels[item.storageType] + '보관'}</p>
        {urgent ? <div role="progressbar" aria-label="남은 소비기한 비율" aria-valuenow={item.freshnessPercent} aria-valuemin={0} aria-valuemax={100} className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f7faf6]"><div className={`h-full rounded-full ${status.barClassName}`} style={{ width: item.freshnessPercent + '%' }} /></div> : <div className="mt-1 flex justify-between gap-1 text-[10px] text-[#78867e]"><span>구매 {item.storedDays}일 전</span><span>{expiryLabel(item.daysLeft)}</span></div>}
      </div>
    </div>
    {urgent && <p className="mt-3 flex items-start gap-1.5 border-t border-[#fafcf9] pt-2.5 text-[11px] leading-4 text-[#68786d]"><Utensils aria-hidden="true" className="size-3.5 shrink-0 text-[#008768]" />{item.recommendedRecipes.length ? '추천: ' + item.recommendedRecipes.join(', ') : '제품에 표시된 소비기한을 확인해주세요.'}</p>}
  </article>
}
