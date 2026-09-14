import { ArrowRight, ChevronRight, Leaf, Moon, Snowflake, Sprout, Sun } from 'lucide-react'
import { formatNotificationTime } from '../../data/notifications'
const icons = { leaf: Leaf, snowflake: Snowflake, sprout: Sprout, sun: Sun, moon: Moon }
export default function NotificationCard({ notification: item, onRead, onAction }) {
  const coach = item.category === 'coach'
  const danger = item.category === 'expiry' && item.daysLeft <= 1
  const purple = item.mealType === 'dinner'
  const Icon = icons[item.icon] ?? Leaf
  const badgeClass = coach ? 'bg-[#e0f4eb] text-[#007f5c]' : danger ? 'bg-[#ffe3e8] text-[#ef345b]' : purple ? 'bg-[#eeedff] text-[#6453d7]' : item.category === 'menu' ? 'bg-[#e5f3ed] text-[#007f5c]' : 'bg-[#fff6d8] text-[#b96113]'
  return <article data-notification-id={item.id} data-read={item.isRead} className={`rounded-2xl border p-3 shadow-xs transition-colors ${item.isRead ? 'border-[#e5e7eb] bg-white opacity-70' : coach ? 'border-[#a7f3d0] bg-[#f0faf5]' : danger ? 'border-[#ffcbd5] bg-[#fffafa]' : 'border-[#e5e7eb] bg-white'}`}>
    <button type="button" aria-label={item.title + ' 읽음 처리'} onClick={() => onRead(item.id)} className="flex w-full items-start gap-2.5 text-left">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border ${coach ? 'border-[#6ee7b7] bg-white text-[#008768]' : purple ? 'border-[#d6ddff] bg-[#eef2ff] text-[#7160db]' : danger ? 'border-[#ffcbd5] bg-[#ffeef0] text-[#ee6785]' : 'border-[#fde68a] bg-[#fffbeb] text-[#b78936]'}`}><Icon aria-hidden="true" className="size-5" /></span>
      <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-1"><span className={`rounded px-1.5 py-1 text-[10px] font-semibold ${badgeClass}`}>{item.badge}</span><time dateTime={item.createdAt} className="text-[9px] text-[#a1a1aa]">{formatNotificationTime(item.createdAt)}</time></span><span className="mt-1 block break-words text-[12px] font-bold leading-5 text-[#292c2a]">{item.title}</span><span className="mt-1 block break-words text-[11px] leading-[19px] text-[#777c77]">{item.description}</span></span>
    </button>
    <div className={`mt-3 flex flex-wrap items-center justify-end gap-1.5 ${item.category === 'expiry' ? 'ml-[50px] border-t border-[#f3f4f6] pt-2' : ''}`}>
      {item.category === 'menu' && <><span className="rounded bg-[#f5f5f4] px-1.5 py-1 text-[9px] text-[#777c77]">냉장고 매칭 {item.ingredientsMatched}/{item.ingredientCount} 재료</span><span className="rounded bg-[#ecfdf5] px-1.5 py-1 text-[9px] text-[#008768]">소요시간 {item.cookTime}분</span></>}
      <button data-no-drag type="button" onClick={() => { onRead(item.id); onAction(item.action) }} className={`flex items-center gap-1 text-[11px] font-semibold ${item.category === 'expiry' ? 'py-1 text-[#008768]' : 'rounded-lg border border-[#a7f3d0] bg-white px-2 py-1.5 text-[#59615c]'}`}>{coach ? '냉장고 확인' : item.category === 'expiry' ? '소진 레시피 확인' : '레시피'}{item.category === 'expiry' ? <ChevronRight aria-hidden="true" className="size-3.5" /> : <ArrowRight aria-hidden="true" className="size-3.5" />}</button>
    </div>
  </article>
}
