import arrowIcon from '../../assets/icons/continue-arrow.svg'

export default function OnboardingFooter({ disabled, onContinue, onPolicy }) {
  return (
    <footer className="z-10 flex shrink-0 flex-col gap-2 border-t border-[#f1f5f9] bg-[#f8fafc]/95 px-5 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] backdrop-blur-[6px]">
      <button type="button" disabled={disabled} onClick={onContinue} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#047857] px-4 py-3.5 text-sm leading-5 text-white shadow-[0_4px_6px_-1px_rgba(6,78,59,0.1)] hover:bg-[#066247] disabled:cursor-not-allowed disabled:opacity-40">
        취향 설정하고 시작하기<img src={arrowIcon} alt="" className="h-[9px] w-[10.5px]" />
      </button>
      <p className="text-center text-[10px] leading-[15px] text-[#94a3b8]">한끼루프의 <button type="button" onClick={onPolicy} className="text-[#64748b] underline">운영 정책</button>을 확인해주세요.</p>
    </footer>
  )
}
