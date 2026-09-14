import backIcon from '../../assets/icons/consent-back.svg'

export default function AccountConsentHeader({ onBack }) {
  return (
    <header className="z-10 grid h-app-header shrink-0 grid-cols-[48px_1fr_48px] items-center border-b border-[#f3f4f6] bg-white/70 px-5 backdrop-blur-[6px]">
      <button type="button" onClick={onBack} aria-label="계정 선택으로 돌아가기" className="-ml-1.5 flex size-10 items-center justify-center rounded-full">
        <img src={backIcon} alt="" className="size-4" />
      </button>
      <h1 className="text-center text-base leading-6 font-bold tracking-[-0.4px] text-[#111827]">계정 연동 동의</h1>
      <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-full bg-[#f0fbf5] text-center text-[13px] leading-[19px] font-bold text-[#39765a]">안전<br />연동</span>
    </header>
  )
}