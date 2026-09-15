import { Hourglass, ChevronRight, Refrigerator, TriangleAlert, CookingPot, Lightbulb, Sprout, Utensils } from 'lucide-react'
import { useEffect, useRef } from 'react'
import HomeHeader from '../components/home/HomeHeader'
import HomeRecipeCard from '../components/home/HomeRecipeCard'
import BottomNavigation from '../components/common/BottomNavigation'
import character from '../assets/hankkiloop-character.png'
import { expiryLabel, storageLabels } from '../data/inventory'
import { recipes, sortRecipesByLatest } from '../data/recipes'

// API 연결 시 동일한 레시피 형식의 추천 목록을 recommendedRecipes로 전달합니다.
const defaultRecommendedRecipes = sortRecipesByLatest(recipes).slice(0, 1)

export default function Home({ onNavigate, fridgeItems = [], nickname = '', recommendedRecipes = defaultRecommendedRecipes }) {
  const urgent = fridgeItems.filter(i => i.daysLeft !== null && i.daysLeft <= 2).sort((a,b) => a.daysLeft-b.daysLeft)
  const first = urgent[0]
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])
  const handleRecipe = () => {
    onNavigate('/recipe')
  }
  const handleFridge = () => {
    onNavigate('/fridge')
  }
  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcf9] outline-none">
      <HomeHeader onProfile={() => onNavigate('/mypage')} />
      <main aria-label="홈" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-[18px] pb-20">
        <section className="flex items-center gap-3.5 rounded-3xl border border-[#e5ece7] bg-white p-3.5 shadow-[0_2px_8px_rgba(27,77,62,0.05)]">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-[#bbf7d0] bg-[#d1fae5]"><img src={character} alt="한끼루프 냉장고 캐릭터" className="absolute top-[-12%] left-[-2%] w-[255%] max-w-none" /></div>
          <div><span className="rounded-full border border-[#a7f3d0]/70 bg-[#ecfdf5] px-2 py-1 text-[11px] text-[#047857]">{nickname ? nickname + '님의 냉장고' : '내 냉장고'}</span><p className="mt-1 text-[13px] leading-[18px] text-[#1e293b]">안녕하세요! 이번 주 식재료를 함께<br className="max-[359px]:hidden" /> 알뜰하게 관리해볼까요? <Sprout aria-hidden="true" className="ml-1 inline size-3 text-[#65a30d]" /></p></div>
        </section>
        <section aria-label="소비기한 알림" className="mt-4 rounded-2xl border border-[#fed7aa] bg-[#fff8ee] p-3.5">
          <div className="flex items-start gap-3"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ffedd5] text-[#ea580c]"><Hourglass aria-hidden="true" className="size-[18px]" /></span><div className="min-w-0 flex-1"><h2 className="text-[13px] text-[#334155]">{first ? first.name + ' 소비기한을 확인해주세요' : '임박한 재료가 없어요'}</h2><p className="mt-0.5 text-[11px] text-[#94a3b8]">{first ? storageLabels[first.storageType] + ' 보관 · ' + first.amount + first.unit : '등록한 재료의 날짜를 기준으로 안내해요'}</p></div><span className="rounded-full bg-[#fb4060] px-2 py-0.5 text-[11px] font-bold text-white">{first ? expiryLabel(first.daysLeft) : '—'}</span></div>
          <button type="button" onClick={handleRecipe} className="mt-2.5 flex min-h-9 w-full items-center justify-between gap-2 rounded-xl border border-[#fed7aa] bg-white px-3 text-left text-xs text-[#c66b43]"><span className="flex items-center gap-1.5"><Utensils aria-hidden="true" className="size-3.5 shrink-0" />레시피 둘러보기</span><ChevronRight aria-hidden="true" className="size-3.5 shrink-0" /></button>
        </section>
        <section className="mt-4">
          <div className="mb-2.5 flex items-center justify-between px-1"><h2 className="text-sm text-[#1e293b]">식단 & 냉장고 현황</h2><button type="button" onClick={handleFridge} className="text-xs text-[#1b4d3e]">관리하기</button></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-[#e5ece7] bg-white p-3.5 shadow-xs"><div className="flex items-center justify-between gap-1"><h3 className="text-xs text-[#94a3b8]">내 냉장고 재고</h3><span className="flex size-7 items-center justify-center rounded-full bg-[#f3f4f6]"><Refrigerator aria-hidden="true" className="size-3.5 text-[#64748b]" /></span></div><p className="mt-2 text-xs text-[#94a3b8]"><strong className="text-base text-[#111827]">{fridgeItems.length}개</strong> 보관 중</p><p className="mt-1 text-[10px] text-[#94a3b8]">{['fridge','freezer','room'].map(type => storageLabels[type] + ' ' + fridgeItems.filter(i => i.storageType === type).length).join(' · ')}</p></div>
            <div className="rounded-2xl border border-[#e5ece7] bg-white p-3.5 shadow-xs"><div className="flex items-center justify-between gap-1"><h3 className="text-xs text-[#ea580c]">소비 임박 알림</h3><span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-[#fffbeb] text-sm text-[#f59e0b]"><TriangleAlert aria-hidden="true" className="size-4" /></span></div><p className="mt-2 text-base text-[#c66b43]">{urgent.length ? urgent.map(i => i.name).join(', ') : '임박 재료 없음'}</p><p className="mt-1 text-[10px] text-[#94a3b8]">{urgent.length}개 재료 · 기한 경과 포함</p></div>
          </div>
        </section>
        <section className="mt-7"><h2 className="mb-3 flex items-center gap-2 px-1 text-sm text-[#1e293b]"><CookingPot aria-hidden="true" className="size-4 text-[#ea8000]" />둘러볼 레시피 (예시)</h2><div className="space-y-3">{recommendedRecipes.map((recipe) => <HomeRecipeCard key={recipe.id} recipe={recipe} onOpen={(id) => onNavigate(`/recipe/${encodeURIComponent(id)}`)} />)}</div></section>
        <aside className="mt-4 flex items-center gap-3 rounded-2xl border border-[#d1fae5] bg-[#ecfdf5]/70 p-3.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#a7f3d0]/70 bg-white"><Lightbulb aria-hidden="true" className="size-5 text-[#008b65]" /></span><p className="text-xs leading-[17px] text-[#334155]">대파는 송송 썰어 냉동실에 보관하면<br /><span className="text-[11px] text-[#94a3b8]">최대 한 달 동안 향긋하고 신선하게 쓸 수 있어요.</span></p></aside>
      </main>
      <BottomNavigation onNavigate={onNavigate} />
    </div>
  )
}
