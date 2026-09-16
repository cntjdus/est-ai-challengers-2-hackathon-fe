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
  return <section className="space-y-3 rounded-2xl bg-white p-4">
    <h2 className="font-semibold">품목별 단위 환산</h2>
    <p className="text-xs leading-5 text-slate-600">제품 표시나 직접 잰 무게로 입력해주세요. 예: 두부 1모 = 300g. 개·모·대는 같은 개수 단위로 저장됩니다. 이 기준은 내 계정의 해당 품목에 공통 적용돼요. 포장 크기가 다르면 g·ml로 등록해주세요. 기존 장바구니 구매량은 유지됩니다.</p>
    {error && <p role="alert">{error}<button onClick={onReload}>다시 불러오기</button></p>}
    <form onSubmit={event => { event.preventDefault(); run(() => saveUnitConversion(client, userId, food, unit, amount)) }}>
      <fieldset disabled={busy || loading || !!error} className="space-y-2">
        <label className="block text-sm">식재료<select required aria-label="환산 식재료" value={foodId} onChange={e => { setFoodId(e.target.value); setAmount(''); const selected = foods.find(f => f.id === e.target.value); setUnit(selected?.base_unit === 'ea' ? 'g' : 'ea') }} className="ml-2 rounded border p-2"><option value="">선택</option>{foods.filter(f => f.is_active !== false).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
        <div className="flex flex-wrap items-center gap-2 text-sm"><span>1</span><select aria-label="환산 원래 단위" value={unit} onChange={e => setUnit(e.target.value)} className="rounded border p-2">{Object.entries(unitLabels).filter(([u]) => u !== food?.base_unit).map(([u, label]) => <option key={u} value={u}>{label}</option>)}</select><span>=</span><input aria-label="기준 단위 수량" required type="number" min="0.0001" max="999999999.9999" step="0.0001" value={amount} onChange={e => setAmount(e.target.value)} className="w-24 rounded border p-2" /><span>{unitLabels[food?.base_unit] ?? '기준 단위'}</span></div>
        <button disabled={!food} className="rounded bg-[#006c49] px-3 py-2 text-sm text-white disabled:opacity-40">환산 기준 저장</button>
      </fieldset>
    </form>
    <p className="text-xs text-slate-500">ml 기준 품목의 계량 큰술은 15ml, 작은술은 5ml입니다. 직접 저장한 기준이 우선 적용됩니다.</p>
    <ul className="space-y-2 text-sm">{conversions.map(c => { const f = foods.find(x => x.id === c.food_id); return <li key={c.food_id + c.unit} className="flex justify-between gap-2"><span>{f?.name} 1{unitLabels[c.unit]} = {c.base_quantity}{unitLabels[f?.base_unit]}</span><button disabled={busy || loading} onClick={() => run(() => removeUnitConversion(client, userId, c.food_id, c.unit))} className="shrink-0 underline">기준 삭제</button></li> })}</ul>
    {message && <p role="status" className="text-xs">{message}</p>}
  </section>
}
