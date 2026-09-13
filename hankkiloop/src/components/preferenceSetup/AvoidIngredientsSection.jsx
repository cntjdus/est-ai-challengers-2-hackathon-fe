import search from '../../assets/icons/ingredient-search.svg'
import close from '../../assets/icons/close.svg'
export default function AvoidIngredientsSection({ ingredientInput, onInputChange, onInputKeyDown, excludedIngredients, onRemove }) {
  return (
    <section aria-labelledby="avoid-heading" className="flex flex-col gap-3 rounded-2xl bg-white p-[15px] shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
      <div><h2 id="avoid-heading" className="text-lg leading-7 tracking-[-0.45px] text-[#111827]">피하고 싶은 재료</h2><p className="text-xs leading-4 text-[#6b7280]">알레르기나 선호하지 않는 재료를 제외해 드려요.</p></div>
      <div className="flex items-center gap-2 rounded-2xl bg-[#eef3ee] px-4 focus-within:ring-2 focus-within:ring-[#059669]">
        <img src={search} alt="" className="size-4 shrink-0" />
        <input aria-label="제외 재료 검색" value={ingredientInput} onChange={(event) => onInputChange(event.target.value)} onKeyDown={onInputKeyDown} enterKeyHint="done" placeholder="알레르기·비선호 재료 검색 (예: 땅콩, 오이)" className="min-h-11 w-full min-w-0 bg-transparent py-3 text-xs outline-none" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
        <span className="pr-1 text-[#9ca3af]">선택된 제외 재료:</span>
        {excludedIngredients.map((ingredient) => <span key={ingredient} className="flex max-w-full items-center gap-1.5 rounded-full border border-[#d5e2d7] bg-[#e9efea] px-3 py-1 text-[#526655]"><span className="min-w-0 break-all">{ingredient}</span><button type="button" aria-label={ingredient + ' 제외 해제'} onClick={() => onRemove(ingredient)} className="flex size-4 shrink-0 items-center justify-center"><img src={close} alt="" className="size-2" /></button></span>)}
      </div>
    </section>
  )
}
