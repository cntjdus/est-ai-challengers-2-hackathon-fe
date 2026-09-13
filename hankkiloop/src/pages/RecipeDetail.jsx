import StockDeductionSheet from '../components/recipe/StockDeductionSheet'
import { useRef, useState } from 'react'
import { ArrowRight, Bookmark, Check, Minus, Plus, Sprout } from 'lucide-react'
import EditProfileHeader from '../components/profile/EditProfileHeader'
import FloatingAssistant from '../components/common/FloatingAssistant'
import { recipes } from '../data/recipes'
import character from '../assets/hankkiloop-character.png'

function formatAmount(ingredient, ratio) {
  if (typeof ingredient.quantity !== 'number') return ingredient.amount
  const value = ingredient.quantity * ratio
  for (const denominator of [1, 2, 3, 4, 8]) {
    const numerator = Math.round(value * denominator)
    if (Math.abs(numerator / denominator - value) < 0.001) return (denominator === 1 ? numerator : numerator + '/' + denominator) + ingredient.unit
  }
  return Number(value.toFixed(2)) + ingredient.unit
}

export default function RecipeDetail({ recipeId, savedIds, onToggleSave, onBack, inventory, onDeductStock }) {
  const recipe = recipes.find((item) => item.id === recipeId)
  const [servings, setServings] = useState(recipe?.servings ?? 1)
  const [expanded, setExpanded] = useState(false)
  const [added, setAdded] = useState([])
  const [completed, setCompleted] = useState(false)
  const [isStockSheetOpen, setIsStockSheetOpen] = useState(false)
  const tipRef = useRef(null)
  const stepRefs = useRef([])
  const handleCompleteCooking = () => {
    setIsStockSheetOpen(true)
  }
  if (!recipe) return <div className="mx-auto flex h-dvh w-full max-w-app flex-col bg-[#fafcfb]"><EditProfileHeader onBack={onBack} title="" plain /><main className="p-6 text-center"><h1 className="text-xl font-bold">레시피를 찾을 수 없습니다</h1><button onClick={onBack} className="mt-6 rounded-xl bg-[#1b4535] px-5 py-3 text-white">레시피 목록으로</button></main></div>
  const saved = savedIds.includes(recipe.id)
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcfb] text-[#111827]">
      <EditProfileHeader onBack={onBack} title="" plain action={<button type="button" aria-label={recipe.title + ' 스크랩'} aria-pressed={saved} onClick={() => onToggleSave(recipe.id)} className="flex size-10 items-center justify-center rounded-full"><Bookmark aria-hidden="true" className="size-6" fill={saved ? 'currentColor' : 'none'} /></button>} />
      <main aria-label="레시피 상세" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-24">
        <h1 className="text-2xl font-bold leading-9">{recipe.title}</h1>
        <p id="recipe-description" className={`mt-2 text-sm leading-6 text-[#374151] ${expanded ? '' : 'line-clamp-3'}`}>{recipe.description}</p>
        <button type="button" aria-expanded={expanded} aria-controls="recipe-description" onClick={() => setExpanded(!expanded)} className="mt-1 text-sm font-semibold text-[#3478ff]">{expanded ? '접기' : '더보기'}</button>
        <dl className="mt-6 grid grid-cols-3 rounded-2xl border border-[#e2ebe5] bg-[#f3f7f5] py-4 text-center">
          {[['인분', servings + '인분'], ['조리', '약 ' + recipe.minutes + '분'], ['난이도', recipe.difficulty]].map(([label, value]) => <div key={label} className="border-r border-[#e5e7eb] last:border-0"><dt className="text-xs text-[#7c8595]">{label}</dt><dd className="mt-1 text-base font-bold">{value}</dd></div>)}
        </dl>
        <section className="mt-6 border-b border-[#f0f2f3] pb-6"><h2 className="text-lg font-bold">조리 도구</h2><p className="mt-2 text-sm">{recipe.tools.join(' · ')}</p></section>
        <section className="mt-2">
          <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold">재료</h2><div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f4f5f5] p-1 text-sm"><button type="button" aria-label="인분 줄이기" disabled={servings === 1 || completed} onClick={() => setServings(servings - 1)} className="flex size-7 items-center justify-center rounded-lg bg-white shadow-xs disabled:opacity-40"><Minus className="size-3" /></button><output aria-label="인분" className="min-w-4 text-center font-bold">{servings}</output><button type="button" aria-label="인분 늘리기" disabled={completed} onClick={() => setServings(servings + 1)} className="flex size-7 items-center justify-center rounded-lg bg-white shadow-xs disabled:opacity-40"><Plus className="size-3" /></button><span className="pr-1 text-xs text-[#7c8595]">인분</span></div></div>
          <ul className="mt-3">{recipe.ingredients.map((source) => { const ingredient = { ...source, inFridge: (inventory[source.id] ?? 0) > 0 }; return <li key={ingredient.id} className={`flex min-h-13 items-center gap-2 border-b border-[#f0f2f3] py-2 text-sm ${ingredient.inFridge ? 'my-2 rounded-lg bg-[#f0fbf6] px-2' : ''}`}>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"><span>{ingredient.name}</span>{ingredient.inFridge && ingredient.storageLabel && <span className="rounded bg-[#d9faeb] px-1.5 py-1 text-[10px] font-semibold text-[#008768]">{ingredient.storageLabel}</span>}</div>
            <span className="shrink-0 text-[#7c8595]">{formatAmount(ingredient, servings / recipe.servings)}</span>
            {ingredient.inFridge ? <span className="min-w-12 rounded-full bg-[#e0f7ec] px-2 py-1 text-center text-xs font-semibold text-[#008768]">있음</span> : <button type="button" aria-label={ingredient.name + ' 담기'} aria-pressed={added.includes(ingredient.name)} onClick={() => setAdded((current) => current.includes(ingredient.name) ? current.filter((name) => name !== ingredient.name) : [...current, ingredient.name])} className="min-w-14 shrink-0 rounded-full border border-[#3478ff] px-2 py-1 text-xs font-semibold text-[#3478ff] aria-pressed:bg-[#eaf2ff]">{added.includes(ingredient.name) ? '담김' : '담기 +'}</button>}
          </li> })}</ul>
        </section>
        {recipe.substitute && <aside className="mt-6 flex items-center gap-3 rounded-3xl border border-[#bcf5d5] bg-[#effbf4] p-3.5 shadow-xs"><div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-[#bbf7d0]"><img src={character} alt="" className="absolute top-[-12%] left-[-2%] w-[255%] max-w-none" /></div><div><h2 className="flex items-center gap-1 text-xs font-bold text-[#148b43]">{recipe.substitute.title}<Sprout aria-hidden="true" className="size-3" /></h2><p className="mt-1 text-sm leading-5 text-[#475569]">{recipe.substitute.description}</p></div></aside>}
        <section className="mt-8"><h2 className="text-xl font-bold">조리 순서</h2><div className="mt-5 space-y-6">{recipe.steps.map((step, index) => <section key={step.step} ref={(element) => { stepRefs.current[index] = element }} tabIndex={-1} className="scroll-mt-5 px-5 outline-none"><div className="flex items-center justify-between"><h3 className="text-xs font-bold text-[#007f5c]">STEP {step.step}</h3>{index < recipe.steps.length - 1 && <button type="button" aria-label={'STEP ' + recipe.steps[index + 1].step + '로 이동'} onClick={() => { stepRefs.current[index + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); stepRefs.current[index + 1]?.focus({ preventScroll: true }) }} className="flex size-8 items-center justify-center text-[#007f5c]"><ArrowRight className="size-5" /></button>}</div><p className="mt-2 text-sm font-semibold leading-6">{step.description}</p>{step.subDescription && <p className="mt-2 text-sm leading-6 text-[#6b7280]">{step.subDescription}</p>}</section>)}</div></section>
        {recipe.tip && <aside ref={tipRef} tabIndex={-1} className="mt-8 flex gap-3 rounded-2xl border border-[#cee3ff] bg-[#eff6ff] p-4 shadow-xs outline-none"><img src={character} alt="" className="size-14 shrink-0 rounded-2xl object-cover" /><div><h2 className="flex flex-wrap items-center gap-2 text-sm font-bold">레시피 팁 <span className="rounded-full bg-[#3982f6] px-2 py-1 text-[10px] text-white">AI BOT</span></h2><p className="mt-1.5 text-sm leading-6 text-[#4b5563]">{recipe.tip}</p></div></aside>}
        {completed && <p role="status" className="mt-2 text-center text-xs text-[#64748b]">선택한 재료의 재고 차감을 완료했어요.</p>}
      </main>
      <FloatingAssistant onClick={() => { tipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); tipRef.current?.focus({ preventScroll: true }) }} />
      <footer className="shrink-0 border-t border-[#e5e7eb] bg-white px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <button type="button" disabled={completed} onClick={handleCompleteCooking} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1b4535] text-base font-bold text-white shadow-lg disabled:bg-[#527466]"><Check aria-hidden="true" className="size-6 text-[#6ee7b7]" />{completed ? '요리 완료했어요' : '요리 완료 (재고 차감)'}</button>

      </footer>
      {isStockSheetOpen && <StockDeductionSheet recipe={recipe} servings={servings} inventory={inventory} onClose={() => setIsStockSheetOpen(false)} onConfirm={(selected) => { onDeductStock(selected); setCompleted(true) }} />}
    </div>
  )
}
