import checkIcon from '../../assets/icons/onboarding-verified.svg'

export default function OnboardingGreeting({ account }) {
  return (
    <section className="flex min-h-[126px] flex-col items-center justify-end gap-1 pb-1 text-center">
      <span className="flex min-h-[26px] items-center gap-2 rounded-full border border-[#a7f3d0]/70 bg-[#ecfdf5] px-2.5 py-1 text-[11px] leading-[16.5px] font-bold text-[#047857]">
        <img src={checkIcon} alt="" className="size-[11px]" />Google 계정 확인 완료
      </span>
      <h1 className="text-xl leading-7 tracking-[-0.5px] text-[#1e293b]">반가워요! {account.nickname || account.name}님 🌱</h1>
      <p className="break-keep text-xs leading-4 text-[#64748b]">Google 계정으로 한끼루프와 연결할 준비가 되었어요.</p>
    </section>
  )
}
