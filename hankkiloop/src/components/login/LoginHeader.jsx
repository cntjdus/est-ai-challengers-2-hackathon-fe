import backIcon from '../../assets/header-back.svg'

export default function LoginHeader({ onBack }) {
  return (
    <header className="z-20 grid h-app-header w-full shrink-0 grid-cols-[44px_1fr_44px] items-center bg-[#f8f9ff]/80 px-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-[12px]">
      <button type="button" onClick={onBack} aria-label="뒤로가기" className="flex size-11 items-center justify-center rounded-full">
        <img src={backIcon} alt="" className="h-5 w-[11.775px]" />
      </button>
      <h1 className="text-center text-[17px] leading-6 font-medium tracking-[-0.425px]">로그인</h1>
      <span aria-hidden="true" />
    </header>
  )
}