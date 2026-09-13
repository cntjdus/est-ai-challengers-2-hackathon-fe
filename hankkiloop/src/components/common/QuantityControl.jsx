import { Minus, Plus } from 'lucide-react'
export default function QuantityControl({ value, onChange, min = 1, max = Infinity, step = 1, unit = '', label, variant = 'stock' }) {
  const cart = variant === 'cart'
  const change = (delta) => onChange(Math.min(max, Math.max(min, Number((value + delta).toFixed(3)))))
  return <div className={cart ? 'inline-flex items-center gap-1 rounded-lg border-2 border-[#eff3ff] bg-[#eff3ff] text-sm font-bold' : 'ml-auto flex items-center rounded-lg bg-[#f1f3f5] text-xs font-bold'}>
    <button type="button" aria-label={label + ' 줄이기'} disabled={value <= min} onClick={() => change(-step)} className={`flex items-center justify-center disabled:opacity-30 ${cart ? 'size-8 rounded-md bg-white' : 'size-7'}`}><Minus aria-hidden="true" className={cart ? 'size-4' : 'size-3'} /></button>
    <output aria-label={label} className="min-w-7 text-center">{value}{unit}</output>
    <button type="button" aria-label={label + ' 늘리기'} disabled={value >= max} onClick={() => change(step)} className={`flex items-center justify-center disabled:opacity-30 ${cart ? 'size-8 rounded-md bg-white' : 'size-7'}`}><Plus aria-hidden="true" className={cart ? 'size-4' : 'size-3'} /></button>
  </div>
}
