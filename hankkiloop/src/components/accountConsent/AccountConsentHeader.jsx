import NotificationButton from '../common/NotificationButton'
import backIcon from '../../assets/icons/consent-back.svg'

export default function AccountConsentHeader({ onBack }) {
  return (
    <header className="z-10 flex h-app-header shrink-0 items-center justify-between border-b border-[#f3f4f6] bg-white/70 px-5 backdrop-blur-[6px]">
      <button type="button" onClick={onBack} aria-label="계정 선택으로 돌아가기" className="-ml-1.5 flex size-10 items-center justify-center rounded-full">
        <img src={backIcon} alt="" className="size-4" />
      </button>
      <h1 className="text-base leading-6 font-bold tracking-[-0.4px] text-[#111827]">계정 연동 동의</h1>
      <div className="flex shrink-0 items-center gap-1"><NotificationButton /><div className="flex size-10 items-center justify-center"><span className="rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-center text-[11px] leading-[16.5px] font-semibold text-[#006c49]">안전<br />연동</span></div></div>
    </header>
  )
}
