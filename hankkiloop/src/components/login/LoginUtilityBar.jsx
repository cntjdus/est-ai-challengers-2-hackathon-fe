import backIcon from '../../assets/utility-back.svg'
import chevronIcon from '../../assets/browse-chevron.svg'

export default function LoginUtilityBar({ onBack, onBrowse }) {
  return (
    <nav aria-label="로그인 보조 메뉴" className="flex items-center justify-between px-5 pt-2 pb-3">
      <button type="button" onClick={onBack} aria-label="뒤로 가기" className="flex size-10 items-center justify-center rounded-full bg-[#e9eefb]">
        <img src={backIcon} alt="" className="h-[16.667px] w-[9.813px]" />
      </button>
      <button type="button" onClick={onBrowse} className="flex items-center gap-1 rounded-full bg-[#10b981]/10 px-3 py-2 text-[13px] leading-[18px] font-medium tracking-[0.13px] text-[#006c49]">
        둘러보기
        <img src={chevronIcon} alt="" className="h-2 w-[4.933px]" />
      </button>
    </nav>
  )
}
