import backIcon from '../../assets/icons/consent-back.svg'
import leafIcon from '../../assets/icons/onboarding-leaf.svg'

export default function OnboardingHeader({ onBack }) {
  return (
    <header className="z-10 grid h-app-header shrink-0 grid-cols-[36px_1fr_36px] items-center border-b border-[#f1f5f9] bg-[#f8fafc]/90 px-5 backdrop-blur-[6px]">
      <button type="button" onClick={onBack} aria-label="계정 연동 동의로 돌아가기" className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0]/70 bg-white shadow-xs">
        <img src={backIcon} alt="" className="size-3.5" />
      </button>
      <div className="flex items-center justify-center gap-1.5 text-lg leading-7 tracking-[-0.45px] text-[#111827]">
        <img src={leafIcon} alt="" className="size-[17.46px]" />한끼루프
      </div>
    </header>
  )
}
