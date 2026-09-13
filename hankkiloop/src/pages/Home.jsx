import { Hourglass, ChevronRight, Refrigerator, TriangleAlert, CookingPot, Lightbulb, Sprout, Utensils } from 'lucide-react'
import { useEffect, useRef } from 'react'
import HomeHeader from '../components/home/HomeHeader'
import HomeRecipeCard from '../components/home/HomeRecipeCard'
import BottomNavigation from '../components/common/BottomNavigation'
import character from '../assets/hankkiloop-character.png'

export default function Home({ onNavigate }) {
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])
  const handleRecipe = () => {
    // TODO: 레시피 상세 화면 연결
  }
  const handleFridge = () => {
    // TODO: 냉장고 관리 화면 연결
  }
  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcf9] outline-none">
      <HomeHeader onProfile={() => onNavigate('/mypage')} />
      <main aria-label="홈" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-[18px] pb-20">
        <section className="flex items-center gap-3.5 rounded-3xl border border-[#e5ece7] bg-white p-3.5 shadow-[0_2px_8px_rgba(27,77,62,0.05)]">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-[#bbf7d0] bg-[#d1fae5]"><img src={character} alt="한끼루프 냉장고 캐릭터" className="absolute top-[-12%] left-[-2%] w-[255%] max-w-none" /></div>
          <div><span className="rounded-full border border-[#a7f3d0]/70 bg-[#ecfdf5] px-2 py-1 text-[11px] text-[#047857]">식재료 낭비 방지 14일째</span><p className="mt-1 text-[13px] leading-[18px] text-[#1e293b]">안녕하세요! 이번 주 식재료를 함께<br className="max-[359px]:hidden" /> 알뜰하게 관리해볼까요? <Sprout aria-hidden="true" className="ml-1 inline size-3 text-[#65a30d]" /></p></div>
        </section>
        <section aria-label="소비기한 알림" className="mt-4 rounded-2xl border border-[#fed7aa] bg-[#fff8ee] p-3.5">
          <div className="flex items-start gap-3"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ffedd5] text-[#ea580c]"><Hourglass aria-hidden="true" className="size-[18px]" /></span><div className="min-w-0 flex-1"><h2 className="text-[13px] text-[#334155]">대파를 먼저 사용해주세요</h2><p className="mt-0.5 text-[11px] text-[#94a3b8]">냉장 보관 4일째 · 신선도 양호</p></div><span className="rounded-full bg-[#fb4060] px-2 py-0.5 text-[11px] font-bold text-white">D-2</span></div>
          <button type="button" onClick={handleRecipe} className="mt-2.5 flex min-h-9 w-full items-center justify-between gap-2 rounded-xl border border-[#fed7aa] bg-white px-3 text-left text-xs text-[#c66b43]"><span className="flex items-center gap-1.5"><Utensils aria-hidden="true" className="size-3.5 shrink-0" />대파 + 두부로 만들 수 있는 요리 3개 보기</span><ChevronRight aria-hidden="true" className="size-3.5 shrink-0" /></button>
        </section>
        <section className="mt-4">
          <div className="mb-2.5 flex items-center justify-between px-1"><h2 className="text-sm text-[#1e293b]">식단 & 냉장고 현황</h2><button type="button" onClick={handleFridge} className="text-xs text-[#1b4d3e]">관리하기</button></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-[#e5ece7] bg-white p-3.5 shadow-xs"><div className="flex items-center justify-between gap-1"><h3 className="text-xs text-[#94a3b8]">내 냉장고 재고</h3><span className="flex size-7 items-center justify-center rounded-full bg-[#f3f4f6]"><Refrigerator aria-hidden="true" className="size-3.5 text-[#64748b]" /></span></div><p className="mt-2 text-xs text-[#94a3b8]"><strong className="text-base text-[#111827]">12개</strong> 보관 중</p><p className="mt-1 text-[10px] text-[#94a3b8]">냉장 7 · 냉동 4 · 실온 1</p></div>
            <div className="rounded-2xl border border-[#e5ece7] bg-white p-3.5 shadow-xs"><div className="flex items-center justify-between gap-1"><h3 className="text-xs text-[#ea580c]">소비 임박 알림</h3><span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-[#fffbeb] text-sm text-[#f59e0b]"><TriangleAlert aria-hidden="true" className="size-4" /></span></div><p className="mt-2 text-base text-[#c66b43]">대파, 두부</p><p className="mt-1 text-[10px] text-[#94a3b8]">소비 권장 D-2 마감</p></div>
          </div>
        </section>
        <section className="mt-7"><h2 className="mb-3 flex items-center gap-2 px-1 text-sm text-[#1e293b]"><CookingPot aria-hidden="true" className="size-4 text-[#ea8000]" />남은 재료로 오늘 저녁 뚝딱</h2><HomeRecipeCard onOpen={handleRecipe} /></section>
        <aside className="mt-4 flex items-center gap-3 rounded-2xl border border-[#d1fae5] bg-[#ecfdf5]/70 p-3.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#a7f3d0]/70 bg-white"><Lightbulb aria-hidden="true" className="size-5 text-[#008b65]" /></span><p className="text-xs leading-[17px] text-[#334155]">대파는 송송 썰어 냉동실에 보관하면<br /><span className="text-[11px] text-[#94a3b8]">최대 한 달 동안 향긋하고 신선하게 쓸 수 있어요.</span></p></aside>
      </main>
      <BottomNavigation onNavigate={onNavigate} />
    </div>
  )
}
