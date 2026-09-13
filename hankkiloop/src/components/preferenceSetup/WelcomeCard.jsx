import character from '../../assets/hankkiloop-character.png'
export default function WelcomeCard() {
  return (
    <section className="flex items-center gap-3.5 rounded-3xl border border-[#bbf7d0]/50 bg-linear-165 from-[#ecfdf5]/90 via-[#f3f9f4] to-[#dcfce7]/40 p-[15px] shadow-xs">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-[#bbf7d0] bg-[#a7f3d0]/40">
        <img src={character} alt="한끼루프 냉장고 캐릭터" className="absolute top-[-12%] left-[-2%] w-[255%] max-w-none" />
      </div>
      <div className="min-w-0">
        <h1 className="text-xs leading-4 font-bold text-[#15803d]">반가워요! 🌱</h1>
        <p className="mt-0.5 break-keep text-[13px] leading-[17.88px] text-[#374151]">딱 맞는 건강한 식생활을 위해<br /><strong className="text-[#111827]">3가지만</strong> 가볍게 알려주세요.</p>
      </div>
    </section>
  )
}
