import back from '../../assets/icons/consent-back.svg'
export default function EditProfileHeader({ onBack }) {
  return <header className="grid h-app-header shrink-0 grid-cols-[36px_1fr_36px] items-center border-b border-[#e2e8f0]/60 bg-[#f8fafc]/90 px-4 backdrop-blur-[6px]"><button type="button" onClick={onBack} aria-label="뒤로가기" className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-xs"><img src={back} alt="" className="size-3" /></button><h1 className="text-center text-sm font-bold text-[#1e293b]">개인정보 수정</h1></header>
}
