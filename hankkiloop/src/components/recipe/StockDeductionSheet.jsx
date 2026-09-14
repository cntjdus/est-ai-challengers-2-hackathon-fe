import Checkbox from '../common/Checkbox'
import QuantityControl from '../common/QuantityControl'
import { useRef, useState } from 'react'
import { Check, Plus, X, Sprout, Search } from 'lucide-react'
import BottomSheet from '../common/BottomSheet'
import character from '../../assets/hankkiloop-character.png'
import { createCustomDeduction, customIngredientUnits, roundAmount as round, toInventoryDeductions } from '../../data/stockDeduction'

export default function StockDeductionSheet({ recipe, servings, inventory, registeredMaterials = [], onClose, onConfirm }) {
  const [rows, setRows] = useState(() => recipe.ingredients.map((item) => {
    const stock = inventory[item.id] ?? 0
    const deduct = Math.min(stock, round(item.quantity * servings / recipe.servings))
    return { ...item, stock, deduct, selected: stock > 0 && !item.isSeasoning }
  }))
  const [adding, setAdding] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [customUnit, setCustomUnit] = useState('g')
  const [formError, setFormError] = useState('')
  const [error, setError] = useState('')
  const submitted = useRef(false)
  const formRef = useRef(null)
  const selected = rows.filter((item) => item.selected && item.deduct > 0)
  const eligible = rows.filter((item) => item.stock === null || item.stock > 0)
  const all = eligible.length > 0 && eligible.every((item) => item.selected)
  const skipped = selected.filter((item) => item.stock === null).length
  const patch = (id, values) => { setError(''); setRows((current) => current.map((item) => item.id === id ? { ...item, ...values } : item)) }
  const handleAddIngredient = (event) => {
    event.preventDefault()
    try {
      const item = createCustomDeduction({ name: customName, amount: customAmount, unit: customUnit }, rows, inventory, registeredMaterials)
      setRows((current) => [...current, item])
      setCustomName(''); setCustomAmount(''); setCustomUnit('g'); setFormError(''); setAdding(false)
    } catch (failure) { setFormError(failure.message) }
  }
  const toggleForm = () => {
    setAdding(!adding)
    setFormError('')
    if (!adding) requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }))
  }
  const handleStockDeduction = (close) => {
    if (!selected.length || submitted.current) return
    try { onConfirm(toInventoryDeductions(selected), skipped); submitted.current = true; close() } catch (failure) { setError(failure.message) }
  }
  return <BottomSheet fitVisualViewport onClose={onClose} labelledBy="stock-title" describedBy="stock-description" label="재고 차감" header={(close) => <header className="border-b border-[#f0f1f4] px-5 pb-3"><div className="flex items-center justify-between gap-1"><div className="flex flex-wrap items-center gap-1.5"><h2 id="stock-title" className="text-base font-bold tracking-tight">사용한 식재료 재고 차감</h2><span className="rounded-full border border-[#bbf7d0] bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-semibold text-[#008768]">자동 계산</span></div><button type="button" onClick={close} aria-label="재고 차감 닫기" className="flex size-8 shrink-0 items-center justify-center text-[#9ca3af]"><X aria-hidden="true" className="size-4" /></button></div><p id="stock-description" className="mt-1 text-[10px] text-[#6b7280]">요리에 소진된 재료만 골라 냉장고에서 빼드릴게요</p></header>} footer={(close) => <footer className="shrink-0 bg-white px-5 pt-2 pb-[max(16px,env(safe-area-inset-bottom))]">{error && <p role="alert" className="mb-2 text-xs text-red-600">{error}</p>}{skipped > 0 && <p className="mb-2 text-[10px] text-[#7c8595]">재고를 확인할 수 없는 {skipped}개 재료는 실제 차감에서 제외됩니다.</p>}<button type="button" disabled={!selected.length || submitted.current} onClick={() => handleStockDeduction(close)} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#1b4535] px-2 py-3 text-[12px] font-bold text-white shadow-lg disabled:bg-[#9caeaa]"><Check aria-hidden="true" className="size-5 shrink-0 text-[#6ee7b7]" />선택한 {selected.length}개 재료 냉장고에서 차감하기</button></footer>}>
    <div className="px-5 pt-3 pb-4">
      <aside className="flex items-center gap-3 rounded-2xl border border-[#cfead8] bg-[#f0f9f4] p-3 shadow-xs"><img src={character} alt="" className="size-11 shrink-0 rounded-xl object-cover" /><div><h3 className="flex items-center gap-1 text-xs text-[#006c49]">냉큼이의 코칭 <Sprout aria-hidden="true" className="size-3" /></h3><p className="mt-1 text-[11px] leading-[18px] break-keep text-[#374151]">오늘 요리에 쓴 재료를 확인해 주세요!<br />내 냉장고 재고에서 냉큼 차감해 드릴게요.</p></div></aside>
      <div className="my-4 flex items-center gap-2"><Checkbox checked={all} onChange={() => setRows((current) => current.map((item) => ({ ...item, selected: (item.stock === null || item.stock > 0) && !all })))} label="전체 선택" disabled={!eligible.length} mixed={!all && selected.length > 0} /><span className="text-[11px] font-bold">전체 선택 ({eligible.length}개)</span><span className="ml-auto text-[9px] text-[#9ca3af]">조미료는 선택 해제 가능</span></div>
      <ul className="space-y-2">{rows.map((item) => <li key={item.id} className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 ${item.selected ? 'border-[#a7f3d0] bg-[#f0f9f4]' : 'border-[#e5e7eb] bg-[#fafbfc] text-[#6b7280]'}`}>
        <Checkbox checked={item.selected} onChange={() => patch(item.id, { selected: !item.selected })} label={item.name + ' 선택'} disabled={item.stock !== null && item.stock <= 0} />
        <div className="min-w-0 flex-1 basis-28"><div className="flex flex-wrap items-center gap-1"><h3 className="break-all text-xs font-bold">{item.name}</h3>{item.isSubstitute && <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-1 py-0.5 text-[8px] text-blue-600">대체 재료</span>}<span className={`rounded-full border px-1 py-0.5 text-[8px] ${item.isSeasoning ? 'border-transparent bg-[#eaecef] text-[#7c8595]' : item.stock === null ? 'border-[#e5e7eb] text-[#9ca3af]' : item.storageType === '실온 보관' ? 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]' : 'border-[#a7f3d0] bg-[#ecfdf5] text-[#008768]'}`}>{item.isSeasoning ? '조미료' : item.storageType}</span></div>
        <p className="mt-1 text-[9px] leading-4 text-[#7c8595]">{item.stock === null ? <>{item.deduct}{item.unit} 차감 예정 · {item.unmatchedReason}</> : !item.selected && item.isSeasoning ? '소량 사용 (재고 차감 제외 권장)' : item.stock <= 0 ? '보관 재고 없음' : <>{item.deduct}{item.unit} 차감 예정 · <span className={item.stock - item.deduct <= 0 && item.selected ? 'font-semibold text-[#f97316]' : 'text-[#008768]'}>{item.selected && item.stock - item.deduct <= 0 ? '소진 완료 예정' : '남은 잔여: ' + round(item.stock - (item.selected ? item.deduct : 0)) + item.unit}</span></>}</p></div>
        {item.selected ? <QuantityControl variant="compact" value={item.deduct} onChange={(deduct) => patch(item.id, { deduct })} min={Math.min(item.step, item.deduct, item.stock ?? Infinity)} max={item.stock ?? Infinity} step={item.step} unit={item.unit} label={item.name + ' 차감량'} /> : <span className="text-[10px] text-[#9ca3af]">차감 제외</span>}
        {item.isSubstitute && <button type="button" aria-label={item.name + ' 제거'} onClick={() => setRows((current) => current.filter((row) => row.id !== item.id))} className="flex size-6 items-center justify-center text-[#9ca3af]"><X aria-hidden="true" className="size-3.5" /></button>}
      </li>)}</ul>
      <button type="button" onClick={toggleForm} aria-expanded={adding} aria-controls="custom-ingredient-form" className="mt-2 flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[#6ee7b7] bg-[#f5fdf9] px-2 py-2 text-[10px] font-bold text-[#006c49]"><Plus aria-hidden="true" className="size-4 shrink-0" />사용한 다른 재료 직접 추가 (대체 재료 등)</button>
      {adding && <form id="custom-ingredient-form" ref={formRef} noValidate onSubmit={handleAddIngredient} className="mt-2 rounded-2xl border border-[#a7f3d0] bg-white p-3"><h3 className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-bold"><Plus aria-hidden="true" className="size-4 text-[#009b73]" />사용한 다른 재료 직접 추가<span className="rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-1.5 py-0.5 text-[8px] text-[#008768]">대체 재료</span></h3>
        <label className="flex h-9 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3"><Search aria-hidden="true" className="size-4 shrink-0 text-[#009b73]" /><input aria-label="추가할 재료명" required maxLength={80} value={customName} onChange={(event) => { setCustomName(event.target.value); setFormError('') }} placeholder="예: 쪽파, 표고버섯, 팽이버섯 등 직접 입력" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[10px] placeholder:text-[#98a2b3]" /></label>
        <div className="mt-2 flex flex-wrap items-center gap-2"><div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-2"><label htmlFor="custom-ingredient-amount" className="shrink-0 text-[10px] text-[#7c8595]">수량</label><input id="custom-ingredient-amount" aria-label="추가할 수량" type="number" inputMode="decimal" min="0.001" step="any" required value={customAmount} onChange={(event) => { setCustomAmount(event.target.value); setFormError('') }} className="h-6 min-w-0 w-14 flex-1 rounded-lg border border-[#e2e8f0] bg-white px-1 text-center text-base" /><select aria-label="추가할 단위" required value={customUnit} onChange={(event) => { setCustomUnit(event.target.value); setFormError('') }} className="max-w-16 bg-transparent text-xs">{customIngredientUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></div><button type="submit" className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl bg-[#009b73] px-3 text-[11px] font-bold text-white"><Plus aria-hidden="true" className="size-3.5" />추가하기</button></div>
        {formError && <p role="alert" className="mt-2 text-[11px] text-red-600">{formError}</p>}
      </form>}
    </div>
  </BottomSheet>
}
