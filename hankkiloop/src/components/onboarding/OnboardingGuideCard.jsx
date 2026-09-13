import guideIcon from '../../assets/icons/onboarding-guide.svg'

export default function OnboardingGuideCard() {
  return (
    <section aria-label="취향 설정 안내" className="flex items-start gap-3 rounded-2xl border border-[#d1fae5]/90 bg-[#ecfdf5]/80 p-[15px]">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl border border-[#d1fae5] bg-white">
        <img src={guideIcon} alt="" className="h-3 w-[12.75px]" />
      </span>
      <div className="min-w-0">
        <h2 className="break-keep text-xs leading-[16.5px] text-[#1e293b]">딱 맞는 식생활을 위해 다음 3가지만 알려주세요!</h2>
        <p className="mt-0.5 break-keep text-[11px] leading-[13.75px] text-[#475569]">요리 빈도와 취향을 설정하면 나만의 냉장고가 세팅됩니다.</p>
      </div>
    </section>
  )
}
