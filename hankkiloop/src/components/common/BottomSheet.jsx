import { useEffect, useRef, useState } from 'react'

// Google 계정 선택 시트의 native dialog / pointer drag를 공통으로 사용합니다.
export default function BottomSheet({ onClose, labelledBy, describedBy, header, footer, children, label = '시트', initialHeight = 0.78 }) {
  const dialogRef = useRef(null)
  const sheetRef = useRef(null)
  const contentRef = useRef(null)
  const dragRef = useRef(null)

  const [height, setHeight] = useState(null)
  const [closing, setClosing] = useState(false)
  const close = () => setClosing(true)
  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(onClose, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200)
    return () => clearTimeout(timer)
  }, [closing, onClose])
  useEffect(() => {
    const dialog = dialogRef.current
    const focus = document.activeElement
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    const resize = () => setHeight((current) => current === null ? null : Math.min(current, innerHeight * 0.95))
    window.addEventListener('resize', resize)
    const content = contentRef.current
    // Native scrolling wins except for a downward gesture begun at the top.
    let touch = null
    const start = (event) => {
      if (event.touches.length !== 1 || event.target.closest('button,input,select,label,a')) return
      touch = { y: event.touches[0].clientY, height: sheetRef.current.offsetHeight, atTop: content.scrollTop <= 0 }
    }
    const move = (event) => {
      if (!touch || !touch.atTop) return
      const delta = event.touches[0].clientY - touch.y
      if (delta > 6) { event.preventDefault(); setHeight(Math.max(100, Math.min(innerHeight * 0.95, touch.height - delta))) }
    }
    const end = () => { touch = null }
    content.addEventListener('touchstart', start, { passive: true })
    content.addEventListener('touchmove', move, { passive: false })
    content.addEventListener('touchend', end)
    return () => {

      dialog.close()
      document.body.style.overflow = overflow
      focus?.focus({ preventScroll: true })
      window.removeEventListener('resize', resize)
      content.removeEventListener('touchstart', start)
      content.removeEventListener('touchmove', move)
      content.removeEventListener('touchend', end)
    }
  }, [])
  const startDrag = (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('input,select,a') || (event.target.closest('button') && !event.target.closest('[data-handle]'))) return
    dragRef.current = { id: event.pointerId, y: event.clientY, height: sheetRef.current.offsetHeight }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    setHeight(Math.max(100, Math.min(innerHeight * 0.95, drag.height + drag.y - event.clientY)))
  }
  const endDrag = () => {
    if (dragRef.current && sheetRef.current.offsetHeight < innerHeight * 0.3) close()
    dragRef.current = null
  }
  return <dialog ref={dialogRef} aria-labelledby={labelledBy} aria-describedby={describedBy} onCancel={(event) => { event.preventDefault(); close() }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-[#111827] backdrop:bg-transparent">
    <button type="button" tabIndex={-1} aria-label={label + ' 배경 닫기'} onClick={close} className={`absolute inset-0 bg-black/45 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none ${closing ? 'opacity-0' : ''}`} />
    <div ref={sheetRef} style={{ height: height ?? (initialHeight * 100 + 'dvh') }} className={`absolute bottom-0 left-1/2 flex max-h-[95dvh] w-full max-w-app -translate-x-1/2 flex-col overflow-hidden rounded-t-[28px] bg-white shadow-xl transition-[translate,opacity] duration-200 starting:translate-y-full starting:opacity-0 motion-reduce:transition-none ${closing ? 'translate-y-full opacity-0' : ''}`}>
      <div className="shrink-0 touch-none" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={() => { dragRef.current = null }} onLostPointerCapture={() => { dragRef.current = null }}>
        <button data-handle type="button" aria-label={label + ' 높이 조절'} onKeyDown={(event) => { if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) { event.preventDefault(); setHeight(event.key === 'End' ? innerHeight * 0.95 : event.key === 'Home' ? innerHeight * 0.4 : Math.max(innerHeight * 0.3, Math.min(innerHeight * 0.95, sheetRef.current.offsetHeight + (event.key === 'ArrowUp' ? 40 : -40)))) } }} className="flex h-6 w-full cursor-grab touch-none items-center justify-center active:cursor-grabbing"><span className="h-1 w-10 rounded-full bg-[#d1d5db]" /></button>
        {typeof header === 'function' ? header(close) : header}
      </div>
      <div ref={contentRef} data-sheet-content className="min-h-0 flex-1 overflow-y-auto overscroll-contain" onPointerDown={(event) => { if (event.pointerType === 'mouse' && event.currentTarget.scrollTop === 0) startDrag(event) }} onPointerMove={moveDrag} onPointerUp={endDrag} onTouchEnd={() => { if (sheetRef.current.offsetHeight < innerHeight * 0.3) close() }}>{children}</div>
      {typeof footer === 'function' ? footer(close) : footer}
    </div>
  </dialog>
}
