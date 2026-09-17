import search from '../../assets/icons/ingredient-search.svg'
import close from '../../assets/icons/close.svg'

export default function AvoidIngredientsSection({ ingredientInput, onInputChange, onInputKeyDown, onAdd, excludedIngredients, onRemove, title = '피하고 싶은 재료', description = '선호하지 않는 재료를 입력하고 추가하거나 Enter를 눌러주세요.', sectionId = 'avoid-heading', inputLabel = '제외 재료 검색', selectedLabel = '선택된 제외 재료:' }) {
  return (
    <section aria-labelledby={sectionId} className="flex flex-col gap-3 rounded-2xl bg-white p-[15px] shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
      <div><h2 id={sectionId} className="text-lg leading-7 tracking-[-0.45px] text-[#111827]">{title}</h2><p className="text-xs leading-4 text-[#6b7280]">{description}</p></div>
      <div className="flex items-center gap-2 rounded-2xl bg-[#eef3ee] px-4 focus-within:ring-2 focus-within:ring-[#059669]">
        <img src={search} alt="" className="size-4 shrink-0" />
        <input aria-label={inputLabel} value={ingredientInput} onChange={event => onInputChange(event.target.value)} onKeyDown={onInputKeyDown} enterKeyHint="done" placeholder="재료 입력 (예: 땅콩, 오이)" className="min-h-11 w-full min-w-0 bg-transparent py-3 text-xs outline-none" />
        {onAdd && <button type="button" onClick={onAdd} aria-label={title + ' 추가'} className="min-h-11 shrink-0 px-2 text-xs font-semibold text-[#006c49]">추가</button>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
        <span className="pr-1 text-[#9ca3af]">{selectedLabel}</span>
        {excludedIngredients.length === 0 && <span className="text-[#64748b]">없음</span>}
        {excludedIngredients.map(ingredient => <span key={ingredient} className="flex max-w-full items-center gap-1.5 rounded-full border border-[#d5e2d7] bg-[#e9efea] px-3 py-1 text-[#526655]"><span className="min-w-0 break-all">{ingredient}</span><button type="button" aria-label={ingredient + ' 제외 해제'} onClick={() => onRemove(ingredient)} className="flex size-4 shrink-0 items-center justify-center"><img src={close} alt="" className="size-2" /></button></span>)}
      </div>
    </section>
  )
}
