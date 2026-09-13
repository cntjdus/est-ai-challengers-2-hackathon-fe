import arrowIcon from '../../assets/icons/continue-arrow.svg'
import switchIcon from '../../assets/icons/account-switch.svg'

export default function ConsentFooter({ onConsent, onChangeAccount }) {
  return (
    <footer className="z-10 flex shrink-0 flex-col gap-2.5 border-t border-[#f3f4f6] bg-white px-5 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-4px_8px_rgba(0,0,0,0.03)]">
      <button type="button" onClick={onConsent} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#006c49] px-4 py-3.5 text-sm leading-5 font-bold text-white shadow-[0_4px_6px_-1px_rgba(6,78,59,0.1)] hover:bg-[#005b3e]">
        동의하고 계속하기<img src={arrowIcon} alt="" className="size-3" />
      </button>
      <button type="button" onClick={onChangeAccount} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e5e7eb]/80 bg-[#f9fafb] px-4 py-2.5 text-xs leading-4 font-semibold text-[#4b5563]">
        <img src={switchIcon} alt="" className="h-[10.667px] w-[13.333px]" />다른 계정 선택
      </button>
    </footer>
  )
}
