import { Sparkles } from 'lucide-react'
export default function FloatingAssistant({ onClick }) {
  return <button type="button" aria-label="AI 채팅 열기" onClick={onClick} className="absolute right-4 bottom-[calc(var(--spacing-bottom-nav)+16px+env(safe-area-inset-bottom))] flex size-14 items-center justify-center rounded-full bg-[#006c49] text-white shadow-lg transition-[background-color,box-shadow] duration-300 ease-out hover:bg-[#006344] hover:shadow-[0_8px_20px_rgba(0,108,73,0.22)] active:bg-[#005b3e] active:shadow-md motion-reduce:transition-none"><Sparkles aria-hidden="true" className="size-7" /></button>
}
