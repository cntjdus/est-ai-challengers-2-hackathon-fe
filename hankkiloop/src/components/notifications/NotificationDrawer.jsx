import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import useModalDialog from '../../hooks/useModalDialog'
import NotificationCard from './NotificationCard'
const categories = [{ id: 'all', label: '전체' }, { id: 'expiry', label: '소비임박' }, { id: 'menu', label: '메뉴 추천' }, { id: 'coach', label: '냉큼이' }]

export default function NotificationDrawer({ notifications, onClose, onRead, onMarkAllRead, onAction, loading = false, error = '', onRetry }) {
  const dialogRef = useRef(null)
  const panelRef = useRef(null)
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  const [category, setCategory] = useState('all')
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const unread = notifications.filter((item) => !item.isRead).length
  const visible = notifications.filter((item) => category === 'all' || item.category === category)
  useModalDialog(dialogRef)
  const close = () => setClosing(true)
  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(onClose, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220)
    return () => clearTimeout(timer)
  }, [closing, onClose])
  const start = (event) => {
    suppressClick.current = false
    if (!event.isPrimary || event.button !== 0 || event.target.closest('[data-no-drag],input,select,textarea')) return
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: 0, axis: null }
  }
  const move = (event) => {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (!current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 7) current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (current.axis !== 'x') return
    event.preventDefault()
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
    suppressClick.current = true
    setDragging(true)
    current.offset = Math.max(0, Math.min(panelRef.current.offsetWidth, dx))
    setOffset(current.offset)
  }
  const end = (cancelled = false) => {
    const current = gesture.current
    if (!current) return
    if (!cancelled && current.axis === 'x' && current.offset >= panelRef.current.offsetWidth * 0.3) close()
    else setOffset(0)
    gesture.current = null
    setDragging(false)
  }
  return <dialog ref={dialogRef} aria-labelledby="notification-title" onCancel={(event) => { event.preventDefault(); close() }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-transparent">
    <button tabIndex={-1} type="button" aria-label="알림 배경 닫기" onClick={close} className={`absolute inset-0 bg-black/45 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none ${closing ? 'opacity-0' : ''}`} />
    <div className="pointer-events-none absolute top-0 bottom-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom))] left-1/2 w-full max-w-app -translate-x-1/2 overflow-hidden">
      <section ref={panelRef} data-notification-panel style={{ '--drawer-offset': closing ? '100%' : offset + 'px', transitionProperty: dragging ? 'none' : 'translate' }} onPointerDown={start} onPointerMove={move} onPointerUp={() => end()} onPointerCancel={() => end(true)} onLostPointerCapture={(event) => { if (event.target === event.currentTarget) end(true) }} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }} className="pointer-events-auto absolute inset-y-0 right-0 flex w-[84%] translate-x-[var(--drawer-offset)] touch-pan-y flex-col overflow-hidden rounded-l-[30px] bg-[#fafafa] shadow-xl duration-200 starting:translate-x-full motion-reduce:transition-none">
        <header className="shrink-0 border-b border-[#f1f2f3] bg-white px-4 pt-5 pb-3">
          <div className="flex items-center gap-2"><h1 id="notification-title" className="text-xl font-bold text-[#252824]">알림</h1><span data-testid="unread-count" className="rounded-full border border-[#ffe0e6] bg-[#fff3f5] px-2 py-1 text-[11px] font-semibold text-[#f14a6c]">새 알림 {unread}</span><button data-no-drag type="button" aria-label="알림 닫기" onClick={close} className="ml-auto flex size-8 items-center justify-center rounded-full text-[#a1a1aa]"><X aria-hidden="true" className="size-4" /></button></div>
          <div aria-label="알림 분류" className="mt-4 flex gap-1.5 overflow-x-auto pb-1">{categories.map((item) => <button data-no-drag type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className="shrink-0 rounded-full bg-[#f4f4f4] px-2 py-1.5 text-[10px] font-semibold text-[#686964] aria-pressed:bg-[#007450] aria-pressed:text-white">{item.id === 'expiry' && <span aria-hidden="true" className="mr-1 text-[#f59e0b]">●</span>}{item.label}</button>)}</div>
        </header>
        <div className="flex shrink-0 justify-end bg-white px-4 py-3"><button data-no-drag type="button" disabled={loading || !unread} onClick={onMarkAllRead} className="text-[11px] font-semibold text-[#858580] underline underline-offset-2 disabled:opacity-40"><span aria-hidden="true" className="mr-1 text-[#10b981]">●</span>모두 읽음 처리</button></div>
        <div data-notification-content className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 pt-4 pb-6">
          {loading && <p role="status">읽음 상태를 불러오는 중…</p>}{error && <p role="alert">{error}<button onClick={onRetry}>다시 불러오기</button></p>}{!loading && visible.map((item) => <NotificationCard key={item.id} notification={item} onRead={onRead} onAction={onAction} />)}
          {!visible.length && <p role="status" className="py-10 text-center text-xs text-[#858580]">해당 알림이 없어요.</p>}
        </div>
      </section>
    </div>
  </dialog>
}
