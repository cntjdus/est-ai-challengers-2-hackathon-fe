import { useRef, useState } from 'react'
import { unitLabels, saveUnitConversion, removeUnitConversion } from '../../data/unitConversion'

export default function UnitConversionSettings({ client, userId, foods, conversions, loading, error, onReload }) {
  const [foodId, setFoodId] = useState('')
  const [unit, setUnit] = useState('ea')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const working = useRef(false)
  const food = foods.find(f => f.id === foodId)
  const run = async action => {
    if (working.current) return
    working.current = true; setBusy(true); setMessage('')
    try { await action(); setMessage('환산 기준을 저장했어요. 냉장고 비교와 다음 장보기에 적용됩니다.'); onReload() }
    catch (e) { setMessage('저장 실패: ' + e.message) }
    finally { working.current = false; setBusy(false) }
  }
  return <section aria-labelledby="unit-settings-heading" className="space-y-3 rounded-2xl border border-[#e2e8f0]/80 bg-white p-[17px] shadow-xs">
    <div><h2 id="unit-settings-heading" className="text-[17px] leading-6 text-[#161c25]">식재료 단위 설정</h2><p className="mt-1 text-sm font-semibold text-[#334155]">품목별 단위 환산</p><p className="mt-1 text-xs leading-5 text-[#64748b]">개·모·대 같은 단위를 g·ml 기준으로 저장할 수 있어요.</p></div>
    {error && <p role="alert" className="rounded-xl bg-[#fff8ee] px-3 py-2 text-xs text-[#8c5b21]">{error}<button onClick={onReload} className="ml-2 min-h-11 font-semibold underline">다시 불러오기</button></p>}
    <form onSubmit={event => { event.preventDefault(); run(() => saveUnitConversion(client, userId, food, unit, amount)) }}>
      <fieldset disabled={busy || loading || !!error} className="space-y-3">
        <label className="block text-xs font-semibold text-[#334155]">식재료<select required aria-label="환산 식재료" value={foodId} onChange={e => { setFoodId(e.target.value); setAmount(''); const selected = foods.find(f => f.id === e.target.value); setUnit(selected?.base_unit === 'ea' ? 'g' : 'ea') }} className="mt-1.5 block min-h-11 w-full min-w-0 rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm font-normal text-[#161c25] outline-offset-2 focus:outline-[#059669]"><option value="">선택</option>{foods.filter(f => f.is_active !== false).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
        <div><p className="mb-1.5 text-xs font-semibold text-[#334155]">단위 환산 기준</p><div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_12px_minmax(0,1fr)_auto] items-center gap-1.5 text-sm"><span className="flex min-h-11 items-center justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#334155]">1</span><select aria-label="환산 원래 단위" value={unit} onChange={e => setUnit(e.target.value)} className="min-h-11 min-w-0 rounded-xl border border-[#e2e8f0] bg-white px-2 text-[#161c25] outline-offset-2 focus:outline-[#059669]">{Object.entries(unitLabels).filter(([u]) => u !== food?.base_unit).map(([u, label]) => <option key={u} value={u}>{label}</option>)}</select><span className="text-center text-[#64748b]">=</span><input aria-label="기준 단위 수량" required type="number" min="0.0001" max="999999999.9999" step="0.0001" value={amount} onChange={e => setAmount(e.target.value)} className="min-h-11 w-full min-w-0 rounded-xl border border-[#e2e8f0] bg-white px-2 text-[#161c25] outline-offset-2 focus:outline-[#059669]" /><span className="flex min-h-11 items-center rounded-xl bg-[#f1f5f9] px-2 text-xs text-[#475569]">{unitLabels[food?.base_unit] ?? '기준 단위'}</span></div></div>
        <button disabled={!food} className="min-h-11 w-full rounded-xl bg-[#006c49] px-3 py-2 text-sm font-semibold text-white disabled:bg-[#ecfdf5] disabled:text-[#94a3b8]">환산 기준 저장</button>
      </fieldset>
    </form>
    <p className="rounded-xl bg-[#f3f8f5] px-3 py-2 text-[11px] leading-4 text-[#596a60]">ⓘ 두부 1모 = 300g처럼 제품 표시나 직접 잰 무게로 입력해주세요. 개·모·대는 같은 개수 단위로 저장되고, 저장한 기준은 내 계정의 해당 품목에 공통 적용됩니다. 포장 크기가 다르면 g·ml로 등록해주세요. 기존 장바구니 구매량은 유지됩니다.</p>
    <p className="rounded-xl bg-[#f3f8f5] px-3 py-2 text-[11px] leading-4 text-[#596a60]">ⓘ ml 기준 품목의 계량 큰술은 15ml, 작은술은 5ml입니다. 직접 저장한 기준이 우선 적용됩니다.</p>
    <ul className="space-y-2 text-xs">{conversions.map(c => { const f = foods.find(x => x.id === c.food_id); return <li key={c.food_id + c.unit} className="flex items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] px-3 py-2"><span className="min-w-0 break-words text-[#334155]">{f?.name} 1{unitLabels[c.unit]} = {c.base_quantity}{unitLabels[f?.base_unit]}</span><button disabled={busy || loading} onClick={() => run(() => removeUnitConversion(client, userId, c.food_id, c.unit))} className="min-h-11 shrink-0 text-[#64748b] underline">기준 삭제</button></li> })}</ul>
    {message && <p role="status" className="rounded-xl bg-[#ecfdf5] px-3 py-2 text-xs text-[#006c49]">{message}</p>}
  </section>
}
