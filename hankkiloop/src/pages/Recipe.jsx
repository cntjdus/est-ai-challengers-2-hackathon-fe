import { recipes, sortRecipesByLatest } from '../data/recipes'
import { useEffect, useRef, useState } from 'react'
import HomeHeader from '../components/home/HomeHeader'
import BottomNavigation from '../components/common/BottomNavigation'
import RecipeCard from '../components/recipe/RecipeCard'
import character from '../assets/hankkiloop-character.png'

// TODO: 레시피 API 및 Figma 원본 음식 사진 연결
export default function Recipe({ onNavigate, savedIds, onToggleSave, listState, onListStateChange }) {
  const [tab, setTab] = useState(listState.tab ?? 'recipes')
  const [search, setSearch] = useState(listState.search ?? '')
  useEffect(() => { onListStateChange({ tab, search }) }, [tab, search, onListStateChange])
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])
  const visibleRecipes = sortRecipesByLatest(recipes.filter((recipe) =>
    (tab !== 'saved' || savedIds.includes(recipe.id)) &&
    (!search || (recipe.title + recipe.ingredientSummary).includes(search))))
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
          <button type="button" aria-pressed={tab === 'recipes'} onClick={() => { setTab('recipes'); setSearch('') }} className="border-b-[3px] border-transparent py-3 text-base text-[#839087] aria-pressed:border-[#007f5c] aria-pressed:text-[#007f5c]">레시피{tab === 'recipes' && <span className="ml-1 text-[#10b981]">•</span>}</button>
          <button type="button" aria-pressed={tab === 'saved'} onClick={() => setTab('saved')} className="border-b-[3px] border-transparent py-3 text-base text-[#839087] aria-pressed:border-[#007f5c] aria-pressed:text-[#007f5c]">스크랩 <span className="rounded-full bg-[#e9eefb] px-1.5 text-xs">{savedIds.length}</span></button>
        </div>
        <section className="mt-7"><div className="mb-3 flex items-center justify-between gap-1"><h2 className="text-base text-[#1e293b]">{tab === 'saved' ? '스크랩한 레시피' : search ? search + ' 활용 레시피' : '냉장고 맞춤 추천 레시피'}<span className="ml-1 rounded-full bg-[#006c49] px-2 text-[11px] text-white">{visibleRecipes.length}선</span></h2><span className="shrink-0 text-[10px] text-[#839087]">최신순</span></div><div className="flex flex-col gap-3">{visibleRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={() => { onListStateChange({ tab, search }); onNavigate('/recipe/' + recipe.id) }} saved={savedIds.includes(recipe.id)} onToggleSave={() => onToggleSave(recipe.id)} />)}{visibleRecipes.length === 0 && <p role="status" className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#64748b]">{tab === 'saved' ? '스크랩한 레시피가 없습니다.' : '검색 조건에 맞는 레시피가 없습니다.'}</p>}</div></section>
      </main>
      <BottomNavigation onNavigate={onNavigate} />
    </div>
  )
}
