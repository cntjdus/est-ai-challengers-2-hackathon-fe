import NotificationButton from '../common/NotificationButton'
import backIcon from '../../assets/header-back.svg'
import userIcon from '../../assets/user-icon.svg'

export default function LoginHeader({ onBack }) {
  return (
    <header className="z-20 flex h-app-header w-full shrink-0 items-center justify-between bg-[#f8f9ff]/80 px-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-[12px]">
      <button type="button" onClick={onBack} aria-label="뒤로가기" className="-ml-2 flex size-11 items-center justify-center rounded-full">
        <img src={backIcon} alt="" className="h-5 w-[11.775px]" />
      </button>
      <h1 className="flex-1 text-center text-[17px] leading-6 font-medium tracking-[-0.425px]">로그인</h1>
      <div className="flex shrink-0 items-center gap-1"><NotificationButton /><div className="flex size-10 items-center justify-center"><span className="flex size-8 items-center justify-center rounded-full bg-[#006c49]" role="img" aria-label="사용자">
        <img src={userIcon} alt="" className="size-3" />
      </span></div></div>
    </header>
  )
}
