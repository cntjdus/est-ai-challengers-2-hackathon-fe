import checkIcon from '../../assets/icons/account-check.svg'

export default function AccountAvatar({ nickname }) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f3d096] text-sm font-bold text-white shadow-inner">
      {nickname}
      <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-[#10b981] ring-2 ring-white">
        <img src={checkIcon} alt="" className="h-[6.825px] w-[8.95px]" />
      </span>
    </span>
  )
}
