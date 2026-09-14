import NotificationButton from '../common/NotificationButton'
import leaf from '../../assets/icons/onboarding-leaf.svg'
import user from '../../assets/user-icon.svg'
export default function MyPageHeader({ onSettings }) {
  return (
    <header className="flex h-app-header shrink-0 items-center justify-between gap-2 border-b border-[#dde3ef]/40 bg-[#f8f9ff]/90 px-5 backdrop-blur-[6px]">
      <div className="flex min-w-0 items-center gap-1.5">
        <img src={leaf} alt="" className="size-[17.46px]" /><span className="text-lg text-[#111827]">한끼루프</span>
        <h1 className="ml-1 rounded-full bg-[#d1fae5]/60 px-2 py-0.5 text-[10.5px]">마이페이지</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1"><NotificationButton /><button type="button" aria-label="프로필 설정" onClick={onSettings} className="flex size-10 shrink-0 items-center justify-center rounded-full">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#006c49]"><img src={user} alt="" className="size-3" /></span>
      </button></div>
    </header>
  )
}
