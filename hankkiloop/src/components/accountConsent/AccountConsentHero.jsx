import character from '../../assets/hankkiloop-character.png'
import googleLogo from '../../assets/google-logo.svg'

export default function AccountConsentHero() {
  return (
    <section className="flex flex-col items-center pt-2 pb-1 text-center">
      <div className="relative mb-3 size-20">
        <div className="relative size-20 overflow-hidden rounded-2xl border border-[#d1fae5] bg-[#ecfdf5] shadow-[0_0_0_4px_white,0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          <img src={character} alt="한끼루프 마스코트 루피" className="absolute top-[-120%] left-[-107%] w-[535%] max-w-none" />
        </div>
        <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border border-[#e5e7eb] bg-white shadow-md">
          <img src={googleLogo} alt="Google" className="size-4" />
        </span>
      </div>
      <span className="mb-1.5 rounded-full border border-[#a7f3d0]/60 bg-[#ecfdf5] px-[11px] py-[3px] text-xs leading-4 font-bold tracking-[0.3px] text-[#006c49]">FRESH LIVING PANTRY SYSTEM</span>
      <h2 className="text-xl leading-[27.5px] font-bold tracking-[-0.5px] text-[#111827]">한끼루프와 Google 계정을<br />연결할까요?</h2>
      <p className="mt-1.5 break-keep text-xs leading-[19.5px] text-[#6b7280]">스마트 냉장고 재고 관리와 맞춤 식단 레시피를<br />안전하게 동기화하기 위해 정보 연동이 필요해요.</p>
    </section>
  )
}
