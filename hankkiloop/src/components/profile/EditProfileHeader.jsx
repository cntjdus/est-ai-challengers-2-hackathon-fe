import back from '../../assets/icons/consent-back.svg'
import { ArrowLeft } from 'lucide-react'
export default function EditProfileHeader({ onBack, title = '개인정보 수정', action, plain = false }) {
  return <header className={`grid h-app-header shrink-0 grid-cols-[40px_1fr_40px] items-center px-4 ${plain ? '' : 'border-b border-[#e2e8f0]/60 bg-[#f8fafc]/90 backdrop-blur-[6px]'}`}><button type="button" onClick={onBack} aria-label="뒤로가기" className={`flex size-9 items-center justify-center rounded-full ${plain ? '' : 'border border-[#e2e8f0] bg-white shadow-xs'}`}>{plain ? <ArrowLeft aria-hidden="true" className="size-6" /> : <img src={back} alt="" className="size-3" />}</button>{title ? <h1 className="text-center text-sm font-bold text-[#1e293b]">{title}</h1> : <span />}{action}</header>
}
