import { Bookmark, ChevronRight, CircleCheck, CirclePlay, EggFried, Image as ImageIcon, NotebookText, PiggyBank } from 'lucide-react'
export default function RecipeCard({ recipe, saved, onToggleSave, onOpen, compact = false, usage, saveDisabled = false }) {

  if (compact) return <article className="relative flex items-center gap-3 rounded-2xl border border-[#d1fae5] bg-white p-3">
    <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e9eefb]">{recipe.image ? <img src={recipe.image} alt={recipe.title} className="size-full object-cover" /> : <ImageIcon aria-hidden="true" className="size-6 text-[#94a3b8]" />}<span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[9px] text-white">{recipe.minutes}분</span></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1">{usage && <span className="rounded bg-[#d1fae5] px-1.5 py-0.5 text-[9px] text-[#008768]">{usage}</span>}<span className="text-[9px] text-[#98a2b3]">{recipe.tag}</span></div><h3 className="mt-1 text-[13px]"><a href={`/recipe/${recipe.id}`} onClick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onOpen() } }} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-[#007f5c]">{recipe.title}</a></h3><p className="mt-1 truncate text-[10px] text-[#8792a2]">{recipe.ingredientSummary}</p></div><ChevronRight aria-hidden="true" className="size-5 shrink-0 text-[#cbd5e1]" />
  </article>
  const SourceIcon = recipe.sourceType === 'youtube' ? CirclePlay : NotebookText
  return (
    <article className="relative flex items-start gap-3 rounded-2xl border border-[#e0e7f5] bg-white p-4 shadow-xs">
      <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e9eefb]">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} className="size-full object-cover" />
        ) : recipe.id === 'tofu' ? (
          <EggFried aria-hidden="true" className="size-8 text-[#006c49]" />
        ) : (
          <ImageIcon aria-hidden="true" className="size-7 text-[#94a3b8]" />
        )}
        <span className="absolute right-1 bottom-1 rounded bg-[#4b5563]/90 px-1 text-[10px] text-white">
          조리 {recipe.minutes}분
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1"><div className="flex flex-wrap items-center gap-1.5"><h3 className="text-base leading-6 text-[#1e293b]"><a href={`/recipe/${recipe.id}`} onClick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onOpen() } }} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-[#007f5c]">{recipe.title}</a></h3><span className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${recipe.sourceType === 'youtube' ? 'bg-[#fbe9ea] text-[#dc2626]' : 'bg-[#e5f1f0] text-[#008b8b]'}`}>{recipe.sourceType !== 'fridge' && <SourceIcon aria-hidden="true" className="size-2.5" />}{recipe.source}</span></div><button type="button" disabled={saveDisabled} aria-label={recipe.title + ' 스크랩'} aria-pressed={saved} onClick={onToggleSave} className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-[#7b8b82] aria-pressed:text-[#006c49]"><Bookmark aria-hidden="true" className="size-4" fill={saved ? 'currentColor' : 'none'} /></button></div>
        <p className="mt-1.5 text-[13px] leading-[19px] text-[#596a60]">{recipe.ingredientSummary}</p>
        <span className={`mt-2 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 ${recipe.id === 'stew' ? 'bg-[#ffd9d5] text-[#c12828]' : 'bg-[#d8f2e9] text-[#008768]'}`}>{recipe.id === 'stew' ? <strong>!</strong> : recipe.id === 'tofu' ? <PiggyBank aria-hidden="true" className="size-3 shrink-0" /> : <CircleCheck aria-hidden="true" className="size-3 shrink-0" />}{recipe.benefit}</span>
        {recipe.tag && <span className="mt-1 inline-block rounded-full bg-[#e9eefb] px-2 py-0.5 text-[11px] text-[#596a60]">{recipe.tag}</span>}
      </div>
    </article>
  )
}
