import leaf from '../../assets/icons/onboarding-leaf.svg'
import { Bell, UserRound } from 'lucide-react'
export default function HomeHeader({ onProfile, pageLabel = '홈', onNotifications }) {
  return (
    <header className="flex h-app-header shrink-0 items-center justify-between border-b border-[#f1f5f9] bg-[#fafcf9] px-5">
      <div className="flex items-center gap-1.5"><img src={leaf} alt="" className="size-[18px]" /><h1 className="text-lg text-[#111827]">한끼루프</h1><span className="ml-1 rounded-full bg-[#d1fae5]/60 px-2 py-0.5 text-[10px] text-[#006c49]">{pageLabel}</span></div>
      <div className="flex items-center gap-1">{onNotifications && <button type="button" aria-label="알림" onClick={onNotifications} className="flex size-9 items-center justify-center rounded-full text-[#475569]"><Bell aria-hidden="true" className="size-5" /></button>}<button type="button" aria-label="마이페이지 열기" onClick={onProfile} className="flex size-10 items-center justify-center rounded-full"><span className="flex size-8 items-center justify-center rounded-full bg-[#006c49]"><UserRound aria-hidden="true" className="size-3.5 text-white" /></span></button></div>
    </header>
  )
}
