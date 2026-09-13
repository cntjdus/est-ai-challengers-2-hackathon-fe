import checkIcon from '../../assets/icons/account-check.svg'
import chevronIcon from '../../assets/icons/terms-chevron.svg'

export default function AgreementCard({ checked, onChange, onRequiredTerms, onOptionalTerms }) {
  return (
    <section aria-label="서비스 이용 약관" className="flex flex-col gap-2.5 rounded-2xl border border-[#f1f5f9] bg-white p-[17px] shadow-xs">
      <label className="flex cursor-pointer items-center gap-2.5 text-xs leading-4 text-[#1e293b]">
        <span className="relative flex size-5 shrink-0">
          <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-5 cursor-pointer appearance-none rounded-md border border-[#cbd5e1] checked:border-[#047857] checked:bg-[#047857] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857]" />
          {checked && <img src={checkIcon} alt="" className="pointer-events-none absolute top-1/2 left-1/2 h-[6.25px] w-[8.75px] -translate-x-1/2 -translate-y-1/2" />}
        </span>
        서비스 이용 약관 전체 동의
      </label>
      <div className="flex flex-col gap-2 border-t border-[#f8fafc] pt-[5px] pl-7">
        <button type="button" onClick={onRequiredTerms} className="flex items-center justify-between gap-2 py-0.5 text-left text-[11px] leading-[16.5px] text-[#64748b]">
          <span>[필수] 서비스 이용약관 및 개인정보 처리방침</span><img src={chevronIcon} alt="" className="h-[7.5px] w-[4.375px] shrink-0" />
        </button>
        <button type="button" onClick={onOptionalTerms} className="flex items-center justify-between gap-2 py-0.5 text-left text-[11px] leading-[16.5px] text-[#047857]">
          <span>[선택] 식재료 유통기한 및 소진 추천 알림</span><img src={chevronIcon} alt="" className="h-[7.5px] w-[4.375px] shrink-0" />
        </button>
      </div>
    </section>
  )
}
