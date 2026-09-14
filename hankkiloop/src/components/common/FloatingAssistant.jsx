import { Sparkles } from 'lucide-react'
export default function FloatingAssistant({ onClick }) {
  return <button type="button" aria-label="AI 채팅 열기" onClick={onClick} className="absolute z-20 right-4 bottom-[calc(var(--spacing-bottom-nav)+16px+env(safe-area-inset-bottom))] flex size-14 items-center justify-center rounded-full bg-[#2da67c] text-white shadow-lg transition-[background-color,box-shadow] duration-300 ease-out hover:bg-[#26956f] hover:shadow-[0_8px_20px_rgba(45,166,124,0.24)] active:bg-[#208562] active:shadow-md motion-reduce:transition-none"><Sparkles aria-hidden="true" className="size-7" /></button>
}
