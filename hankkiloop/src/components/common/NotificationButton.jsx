import { useId } from 'react'
import { Bell } from 'lucide-react'

export default function NotificationButton({ onClick }) {
  const id = useId()
  return <>
    <button type="button" aria-label="알림" popoverTarget={id} onClick={onClick} className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#475569] transition-colors hover:bg-[#e8f4ee] focus-visible:outline-2 focus-visible:outline-[#007f5c]"><Bell aria-hidden="true" className="size-5" /></button>
    <div id={id} popover="auto" className="fixed top-16 right-[max(20px,calc((100vw-390px)/2+20px))] left-auto m-0 w-64 max-w-[calc(100vw-40px)] rounded-2xl border border-[#e2e8f0] bg-white p-4 text-[#1e293b] shadow-lg">
      <h2 className="text-sm font-semibold">알림</h2><p className="mt-2 text-xs text-[#7c8595]">표시할 알림이 없습니다.</p>
    </div>
  </>
}
