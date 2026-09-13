import { useState } from 'react'
import { Bookmark, BookOpen, Timer } from 'lucide-react'
// Figma 원본 사진 확보 후 imageSrc에 로컬 에셋을 전달합니다.
export default function HomeRecipeCard({ imageSrc, onOpen }) {
  const [saved, setSaved] = useState(false)
  return <article className="rounded-3xl border border-[#e5ece7] bg-white p-3.5 shadow-[0_2px_8px_rgba(27,77,62,0.05)]">
    {imageSrc && <div className="relative mb-3 overflow-hidden rounded-2xl"><img src={imageSrc} alt="두부와 계란, 대파를 볶아 담은 요리" className="aspect-[2/1] w-full object-cover" /><span className="absolute right-2 bottom-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[11px] text-white"><Timer aria-hidden="true" className="size-3" />15분 완성</span></div>}
    <span className="inline-block rounded-full border border-[#a7f3d0]/70 bg-[#ecfdf5] px-2 py-0.5 text-[11px] text-[#047857]">저메추! 딱 좋은 메뉴</span>
    <div className="mt-2 flex items-center justify-between"><h3 className="text-base text-[#1e293b]">두부 계란 볶음</h3><button type="button" aria-label="레시피 저장" aria-pressed={saved} onClick={() => setSaved(!saved)} className="flex size-8 items-center justify-center rounded-full bg-[#f8fafc] text-[#64748b] aria-pressed:bg-[#d1fae5] aria-pressed:text-[#006c49]"><Bookmark aria-hidden="true" className="size-4" fill={saved ? "currentColor" : "none"} /></button></div>
    <p className="mt-1.5 text-xs leading-[19px] text-[#64748b]">지금 있는 대파와 두부 1/2모만으로 간편하고 영양가 높은 한 끼를 준비할 수 있어요.</p>
    <button type="button" onClick={onOpen} className="mt-3 flex min-h-11 w-full items-center justify-center gap-1 rounded-2xl bg-[#1b4d3e] px-3 text-xs text-white">레시피 단계별로 보기<BookOpen aria-hidden="true" className="size-3.5" /></button>
  </article>
}
