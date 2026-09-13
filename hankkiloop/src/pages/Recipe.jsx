import { recipes } from '../data/recipes'
import { useEffect, useRef, useState } from 'react'
import { CirclePlus, Flame, Search } from 'lucide-react'
import HomeHeader from '../components/home/HomeHeader'
import BottomNavigation from '../components/common/BottomNavigation'
import RecipeCard from '../components/recipe/RecipeCard'
import character from '../assets/hankkiloop-character.png'

// TODO: 레시피 API 및 Figma 원본 음식 사진 연결
const categories = ['AI 추천 메뉴', '유튜브 레시피', '블로그 레시피', '냉장고 파먹기']
export default function Recipe({ onNavigate, savedIds, onToggleSave, listState, onListStateChange }) {
  const [tab, setTab] = useState(listState.tab ?? 'recipes')
  const [category, setCategory] = useState(listState.category ?? categories[0])
  const [query, setQuery] = useState(listState.query ?? '')
  const [search, setSearch] = useState(listState.search ?? '')
  useEffect(() => { onListStateChange({ tab, category, query, search }) }, [tab, category, query, search, onListStateChange])
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])
  const visibleRecipes = recipes.filter((recipe) =>
    (tab !== 'saved' || savedIds.includes(recipe.id)) &&
    (category === categories[0] || recipe.sourceType === ({ '유튜브 레시피': 'youtube', '블로그 레시피': 'blog', '냉장고 파먹기': 'fridge' })[category]) &&
    (!search || (recipe.title + recipe.ingredientSummary).includes(search)))
  const handleNotifications = () => { /* TODO: 알림 화면 연결 */ }
  return (
    <div ref={pageRef} tabIndex={-1} className="relative mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcf9] outline-none">
      <HomeHeader pageLabel="레시피" onProfile={() => onNavigate('/mypage')} onNotifications={handleNotifications} />
      <main aria-label="레시피 탐색" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-20">
        <section className="flex items-center gap-3.5 rounded-3xl border border-[#e5ece7] bg-white p-4 shadow-[0_2px_8px_rgba(27,77,62,0.05)]">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-[#bbf7d0] bg-[#d1fae5]"><img src={character} alt="한끼루프 냉장고 캐릭터" className="absolute top-[-12%] left-[-2%] w-[255%] max-w-none" /></div>
          <div><span className="rounded-full border border-[#a7f3d0]/70 bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-bold text-[#047857]">냉큼이와 함께</span><h2 className="mt-1.5 text-base leading-6 text-[#1e293b]">오늘 어떤 요리를 만들어볼까요?</h2></div>
        </section>
        <div aria-label="레시피 보기" className="mt-4 grid grid-cols-2 gap-5">
          <button type="button" aria-pressed={tab === 'recipes'} onClick={() => setTab('recipes')} className="border-b-[3px] border-transparent py-3 text-base text-[#839087] aria-pressed:border-[#007f5c] aria-pressed:text-[#007f5c]">레시피{tab === 'recipes' && <span className="ml-1 text-[#10b981]">•</span>}</button>
          <button type="button" aria-pressed={tab === 'saved'} onClick={() => setTab('saved')} className="border-b-[3px] border-transparent py-3 text-base text-[#839087] aria-pressed:border-[#007f5c] aria-pressed:text-[#007f5c]">스크랩 <span className="rounded-full bg-[#e9eefb] px-1.5 text-xs">{savedIds.length}</span></button>
        </div>
        <div aria-label="레시피 유형" className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className="shrink-0 rounded-full bg-[#eff3ff] px-3.5 py-2 text-[13px] text-[#596a60] aria-pressed:bg-[#006c49] aria-pressed:font-bold aria-pressed:text-white">{item}</button>)}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()) }} className="mt-4 flex min-w-0 items-center gap-2 rounded-2xl bg-[#eff3ff] p-1.5 pl-4">
          <Search aria-hidden="true" className="size-4 shrink-0 text-[#7b8b82]" /><input aria-label="요리 또는 식재료 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="먹고 싶은 요리나 식재료 검색 (예: 두부)" className="min-w-0 flex-1 bg-transparent py-2 text-xs outline-offset-2 placeholder:text-[#bac8bd]" /><button type="submit" className="flex shrink-0 items-center gap-1 rounded-xl bg-[#006c49] px-3 py-2.5 text-sm text-white"><Search aria-hidden="true" className="size-3.5" />검색</button>
        </form>
        <section className="mt-5"><div className="flex items-center justify-between gap-1"><h2 className="flex items-center gap-1 text-[13px] text-[#334155]"><Flame aria-hidden="true" className="size-4 text-[#ff7b22]" />자취생 인기 간편 조합</h2><span className="text-[10px] text-[#839087]">터치하여 바로 탐색</span></div><div className="mt-2 flex gap-2 overflow-x-auto pb-2">{['튜나김치덮밥', '계란말이', '알리오올리오'].map((item) => <button key={item} type="button" onClick={() => { setQuery(item); setSearch(item); setCategory(categories[0]); setTab('recipes') }} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[13px] text-[#334155] shadow-xs"><CirclePlus aria-hidden="true" className="size-3.5 text-[#007f5c]" />{item}</button>)}</div></section>
        <aside className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e0e7ed] bg-[#eff4ff] p-4"><img src={character} alt="" className="size-11 shrink-0 rounded-xl bg-[#cce3e5] p-1 object-contain" /><div><h2 className="text-base text-[#1e293b]">예상 식비 절약 & 소진 효과</h2><p className="mt-1 text-[13px] leading-[18px] text-[#596a60]">추천 메뉴로 냉장고 속 <span className="text-[#008768]">대파, 두부, 양파</span>를 알뜰하게 비워낼 수 있어요!</p></div></aside>
        <section className="mt-7"><div className="mb-3 flex items-center justify-between gap-1"><h2 className="text-base text-[#1e293b]">{tab === 'saved' ? '스크랩한 레시피' : '냉장고 맞춤 추천 레시피'}<span className="ml-1 rounded-full bg-[#006c49] px-2 text-[11px] text-white">{visibleRecipes.length}선</span></h2><span className="shrink-0 text-[10px] text-[#839087]">소비기한 임박 우선</span></div><div className="flex flex-col gap-3">{visibleRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={() => { onListStateChange({ tab, category, query, search }); onNavigate('/recipe/' + recipe.id) }} saved={savedIds.includes(recipe.id)} onToggleSave={() => onToggleSave(recipe.id)} />)}{visibleRecipes.length === 0 && <p role="status" className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#64748b]">{tab === 'saved' ? '스크랩한 레시피가 없습니다.' : '검색 조건에 맞는 레시피가 없습니다.'}</p>}</div></section>
      </main>
      <BottomNavigation onNavigate={onNavigate} />
    </div>
  )
}
