import { Check, Image as ImageIcon, ShoppingCart, Star, Store, Truck } from 'lucide-react'
import { calculatePackageWaste } from '../../data/packageOptions'
const tones = { green: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#008768]', blue: 'border-[#bae6fd] bg-[#f0f9ff] text-[#0284c7]', orange: 'border-[#fed7aa] bg-[#fff7ed] text-[#c66b43]', gray: 'border-[#d1dce8] bg-[#f1f5f9] text-[#475569]' }
export default function ProductOptionCard({ product, selected, recommended, requiredAmount, originalRemaining, onSelect }) {
  const analysis = calculatePackageWaste(product.amount, requiredAmount)
  const savings = Math.max(0, originalRemaining - analysis.remaining)
  const Icon = product.channelType === 'delivery' ? Truck : product.channelType === 'local' ? ShoppingCart : Store
  const badges = [...(recommended ? [{ text: '한끼루프 추천', tone: 'green', star: true }, ...(savings > 0 ? [{ text: '낭비 -' + savings + product.unit + ' 절감', tone: 'gray' }] : [])] : []), ...product.badges]
  return <article aria-label={product.name}>
    <label className="relative block cursor-pointer"><input type="radio" name="package-product" aria-label={product.name} checked={selected} onChange={() => onSelect(product.id)} className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0" />
      <div className="flex items-start gap-2 rounded-2xl border border-[#cbd8e7] bg-white p-4 shadow-xs peer-checked:border-[#007f5c] peer-checked:ring-1 peer-checked:ring-[#007f5c] peer-checked:shadow-md peer-focus-visible:outline-2 peer-focus-visible:outline-[#007f5c]">
        <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-[#7cc8ac] bg-[#007f5c]' : 'border-[#94a3b8]'}`}>{selected && <Check aria-hidden="true" className="size-3 stroke-3 text-white" />}</span>
        <div className="relative flex size-[68px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d1dce8] bg-[#f0f5f2]">{product.image ? <img src={product.image} alt="" className="size-full object-cover" /> : <ImageIcon aria-hidden="true" className="size-6 text-[#94a3b8]" />}<span className="absolute right-1 bottom-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{product.amount}{product.unit}</span></div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-1">{badges.map((badge) => <span key={badge.text} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold leading-4 ${tones[badge.tone] ?? tones.gray}`}>{badge.star && <Star aria-hidden="true" className="size-2.5 fill-current" />}{badge.text}</span>)}</div><h2 className="mt-1.5 break-words text-[13px] font-bold leading-[19px]">{product.name} ({product.amount}{product.unit})</h2>
          <p className="mt-1 flex items-start gap-1 text-[10px] font-semibold leading-4 text-[#475569]"><Icon aria-hidden="true" className="mt-0.5 size-3 shrink-0" /><span>{product.storeName} <span className={product.channelType === 'delivery' ? 'text-[#0284c7]' : 'text-[#007f5c]'}>{product.locationText}</span></span></p>
          <div className="mt-2 rounded-xl border border-[#cbd8e7] bg-[#f7f9fc] p-2.5 text-[10px] leading-4"><div className="flex flex-wrap gap-x-2 gap-y-1"><span className="font-semibold text-[#64748b]">용량 분석: {product.amount}{product.unit}</span><strong className={analysis.shortage ? 'text-[#c66b43]' : 'text-[#007f5c]'}>{analysis.shortage ? '필요량보다 ' + analysis.shortage + product.unit + ' 부족' : analysis.remaining ? '잔여 ' + analysis.remaining + product.unit + ' (' + product.analysisText + ')' : '필요량과 일치 · 잔여 0' + product.unit}</strong></div><p className="mt-1.5 text-[#7c8595]">{product.description}</p></div>
        </div>
      </div>
    </label>
  </article>
}
