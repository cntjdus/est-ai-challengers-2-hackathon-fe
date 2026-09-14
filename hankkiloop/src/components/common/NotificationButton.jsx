import { useContext } from 'react'
import { Bell } from 'lucide-react'
import { NotificationContext } from '../notifications/NotificationContext'

export default function NotificationButton() {
  const notifications = useContext(NotificationContext)
  return <button type="button" aria-label="알림 열기" aria-haspopup="dialog" aria-expanded={notifications?.isOpen ?? false} onClick={notifications?.open} className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-[#475569] transition-colors hover:bg-[#e8f4ee] focus-visible:outline-2 focus-visible:outline-[#007f5c]">
    <Bell aria-hidden="true" className="size-5" />
    {notifications?.unreadCount > 0 && <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#10b981] ring-2 ring-white" />}
  </button>
}
