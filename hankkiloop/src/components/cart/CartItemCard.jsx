import { Image as ImageIcon, TriangleAlert, Utensils, X } from 'lucide-react'
import Checkbox from '../common/Checkbox'
import QuantityControl from '../common/QuantityControl'
import { expectedRemaining, relatedRecipeNames } from '../../data/cart'

export default function CartItemCard({ item, onOpen, onToggle, onRemove, onQuantityChange }) {
  const remaining = expectedRemaining(item)
  const warning = item.riskLevel === 'warning' && remaining > 0
  return <article aria-label={item.name} className="relative rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(27,77,62,0.04)]">
    <button type="button" onClick={onOpen} aria-label={item.name + ' 재료 등록'} className="absolute inset-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006c49]" />
    <div className="pointer-events-none relative flex items-start gap-3"><div className="pointer-events-auto"><Checkbox label={item.name + ' 선택'} checked={item.selected} onChange={() => onToggle(item.id)} /></div>
      <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf3ef]">{item.image ? <img src={item.image} alt={item.name} className="size-full object-cover" /> : <ImageIcon aria-hidden="true" className="size-7 text-[#94a3b8]" />}{warning && <span className="absolute right-1 bottom-1 rounded-md bg-[#ff7b22] px-1.5 py-0.5 text-[10px] text-white">주의</span>}</div>
      <div className="min-w-0 flex-1 pr-4"><p className="text-[11px] text-[#596a60]">{item.storageLabel}</p><h2 className="mt-1 text-sm font-bold leading-5">{item.name}</h2><p className="mt-1 text-xs text-[#006c49]">구매 예정 {Number((item.packageAmount * item.quantity).toFixed(4))}{item.amountUnit}</p><span className="mt-2 inline-flex items-start gap-1 rounded-xl bg-[#e9eefb] px-2 py-1 text-[10px] leading-4 text-[#596a60]"><Utensils aria-hidden="true" className="mt-0.5 size-3 shrink-0" />{relatedRecipeNames(item).join(', ')}</span></div>
      <button type="button" aria-label={item.name + ' 삭제'} onClick={() => onRemove(item.id)} className="pointer-events-auto absolute top-2 right-2 flex size-8 items-center justify-center rounded-full text-[#bac8bd] hover:text-[#596a60]"><X aria-hidden="true" className="size-5" /></button>
    </div>
    <div className="pointer-events-none relative mt-3 pl-7"><p className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs ${warning ? 'bg-[#fff0e9] text-[#9a4b13]' : 'bg-[#effaf4] text-[#006c49]'}`}>{warning && <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />}<span>예상 잔여량 <strong>{remaining}{item.amountUnit}</strong> ({remaining === 0 ? '소진 예정' : item.stockRisk})</span></p><div className="pointer-events-auto mt-4 w-fit"><QuantityControl value={item.quantity} onChange={(value) => onQuantityChange(item.id, value)} label={item.name + ' 수량'} variant="cart" /></div></div>
  </article>
}
