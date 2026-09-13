import { Sparkles } from 'lucide-react'
export default function FloatingAssistant({ onClick }) {
  return <button type="button" aria-label="AI 레시피 도우미" onClick={onClick} className="absolute right-4 bottom-[calc(88px+env(safe-area-inset-bottom))] flex size-14 items-center justify-center rounded-full bg-[#006c49] text-white shadow-lg"><Sparkles aria-hidden="true" className="size-7" /></button>
}
