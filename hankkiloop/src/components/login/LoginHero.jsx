import character from '../../assets/hankkiloop-character.png'
import leaf from '../../assets/leaf-logo.svg'
import badge from '../../assets/character-badge.svg'

export default function LoginHero() {
  return (
    <section aria-labelledby="login-brand" className="flex flex-col items-center px-5 pt-2 pb-5 text-center">
      <div className="relative mb-3 size-28 shrink-0">
        <div aria-hidden="true" className="absolute -inset-1 rounded-3xl bg-linear-45 from-[#10b981]/30 to-[#57dffe]/30 opacity-75 blur-[6px]" />
        <div className="relative flex size-full items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]">
          <img src={character} alt="한끼루프 냉장고 마스코트 루피" className="size-24 object-contain" />
        </div>
        <span className="absolute -right-1 -bottom-1 flex items-center justify-center rounded-full bg-[#10b981] p-1 shadow-xs">
          <img src={badge} alt="" className="size-[9.914px]" />
        </span>
      </div>
      <div className="mb-1 flex items-center gap-1">
        <h2 id="login-brand" className="text-2xl leading-8 font-medium tracking-[-0.6px]">한끼루프</h2>
        <img src={leaf} alt="" className="h-[18.333px] w-[18.288px]" />
      </div>
      <p className="text-sm leading-[22.75px] font-medium text-[#3c4a42]">
        남김 없는 건강한 자취 라이프,<br />
        <span className="text-[#006c49]">한끼루프</span>로 기분 좋게 시작해요 🌱
      </p>
    </section>
  )
}
