import { useEffect, useRef, useState } from 'react'

// Shared by stock deduction and AI chat. Snapping is opt-in for the chat UX.
export default function BottomSheet({ onClose, labelledBy, describedBy, header, footer, children, label = '시트', initialHeight = 0.78, snapPoints, closeThreshold = 0.3, contentClassName = '', fitVisualViewport = false }) {
  const useVisualViewport = fitVisualViewport || Boolean(snapPoints)
  const dialogRef = useRef(null)
  const sheetRef = useRef(null)
  const contentRef = useRef(null)
  const dragRef = useRef(null)
  const heightRef = useRef(null)
  const settleRef = useRef(null)
  const ratioRef = useRef(initialHeight)
  const [height, setHeight] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const [viewport, setViewport] = useState(() => ({ height: useVisualViewport ? (window.visualViewport?.height ?? innerHeight) : innerHeight, top: useVisualViewport ? (window.visualViewport?.offsetTop ?? 0) : 0 }))
  const viewportRef = useRef(viewport.height)
  const updateHeight = (value) => { heightRef.current = value; if (!snapPoints) ratioRef.current = value / viewportRef.current; setHeight(value) }
  const close = () => setClosing(true)
  const settle = () => {
    const current = heightRef.current ?? sheetRef.current.offsetHeight
    if (current < viewportRef.current * closeThreshold) close()
    else if (snapPoints) {
      const ratio = snapPoints.reduce((nearest, point) => Math.abs(point * viewportRef.current - current) < Math.abs(nearest * viewportRef.current - current) ? point : nearest)
      ratioRef.current = ratio
      updateHeight(ratio * viewportRef.current)
    }
    if (!snapPoints) ratioRef.current = current / viewportRef.current
    dragRef.current = null
    setDragging(false)
  }
  useEffect(() => { settleRef.current = settle })
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
    const resize = () => {
      const size = useVisualViewport ? (window.visualViewport?.height ?? innerHeight) : innerHeight
      viewportRef.current = size
      setViewport({ height: size, top: useVisualViewport ? (window.visualViewport?.offsetTop ?? 0) : 0 })
      if (useVisualViewport) { heightRef.current = ratioRef.current * size; setHeight(heightRef.current) }
      else setHeight((current) => current === null ? null : Math.min(current, size * 0.95))
    }
    window.addEventListener('resize', resize)
    if (useVisualViewport) { window.visualViewport?.addEventListener('resize', resize); window.visualViewport?.addEventListener('scroll', resize) }
    const content = contentRef.current
    let touch = null
    const start = (event) => {
      touch = null
      if (event.touches.length !== 1 || event.target.closest('button,input,textarea,select,label,a,[contenteditable]')) return
      touch = { y: event.touches[0].clientY, x: event.touches[0].clientX, height: sheetRef.current.offsetHeight, atTop: content.scrollTop <= 0, moved: false }
    }
    const move = (event) => {
      if (!touch || !touch.atTop || event.touches.length !== 1) return
      if (content.scrollTop > 0 && !touch.moved) { touch.atTop = false; return }
      const delta = event.touches[0].clientY - touch.y
      if (!touch.moved && Math.abs(event.touches[0].clientX - touch.x) > Math.abs(delta)) { touch = null; return }
      if (delta > 6) {
        event.preventDefault()
        touch.moved = true
        setDragging(true)
        const next = Math.max(60, Math.min(viewportRef.current * 0.95, touch.height - delta))
        heightRef.current = next
        setHeight(next)
      }
    }
    const end = () => { if (touch?.moved) settleRef.current(); touch = null }
    content.addEventListener('touchstart', start, { passive: true })
    content.addEventListener('touchmove', move, { passive: false })
    content.addEventListener('touchend', end)
    content.addEventListener('touchcancel', end)
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      focus?.focus({ preventScroll: true })
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('scroll', resize)
      content.removeEventListener('touchstart', start)
      content.removeEventListener('touchmove', move)
      content.removeEventListener('touchend', end)
      content.removeEventListener('touchcancel', end)
    }
  }, [snapPoints, useVisualViewport])
  const startDrag = (event, content = false) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('input,textarea,select,a') || (event.target.closest('button') && !event.target.closest('[data-handle]'))) return
    dragRef.current = { id: event.pointerId, y: event.clientY, height: sheetRef.current.offsetHeight, content }
    heightRef.current = sheetRef.current.offsetHeight
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    const delta = event.clientY - drag.y
    if (drag.content && delta < 6) return
    setDragging(true)
    updateHeight(Math.max(60, Math.min(viewportRef.current * 0.95, drag.height - delta)))
  }
  const endDrag = () => { if (dragRef.current) settle() }
  const handleKey = (event) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (snapPoints) {
      const current = (heightRef.current ?? sheetRef.current.offsetHeight) / viewportRef.current
      if (event.key === 'ArrowDown' && current <= snapPoints[0] + 0.01) { close(); return }
      ratioRef.current = ['ArrowUp', 'End'].includes(event.key) ? snapPoints.at(-1) : snapPoints[0]
      updateHeight(ratioRef.current * viewportRef.current)
    } else updateHeight(event.key === 'End' ? viewportRef.current * 0.95 : event.key === 'Home' ? viewportRef.current * 0.4 : Math.max(viewportRef.current * 0.3, Math.min(viewportRef.current * 0.95, sheetRef.current.offsetHeight + (event.key === 'ArrowUp' ? 40 : -40))))
  }
  return <dialog ref={dialogRef} aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} aria-describedby={describedBy} onCancel={(event) => { event.preventDefault(); close() }} style={useVisualViewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-[#111827] backdrop:bg-transparent">
    <button type="button" tabIndex={-1} aria-label={label + ' 배경 닫기'} onClick={close} className={`absolute inset-0 bg-black/45 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none ${closing ? 'opacity-0' : ''}`} />
    <div ref={sheetRef} data-sheet-panel style={{ height: height ?? viewport.height * initialHeight, maxHeight: viewport.height * 0.95, transitionProperty: dragging ? 'none' : snapPoints ? 'height, translate, opacity' : 'translate, opacity' }} className={`absolute bottom-0 left-1/2 flex w-full max-w-app -translate-x-1/2 flex-col overflow-hidden rounded-t-[28px] bg-white shadow-xl duration-200 starting:translate-y-full starting:opacity-0 motion-reduce:transition-none ${closing ? 'translate-y-full opacity-0' : ''}`}>
      <div className="shrink-0 touch-none" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { if (dragRef.current) settle() }}>
        <button data-handle type="button" aria-label={label + ' 높이 조절'} onKeyDown={handleKey} className="flex h-6 w-full cursor-grab touch-none items-center justify-center active:cursor-grabbing"><span className="h-1 w-10 rounded-full bg-[#d1d5db]" /></button>
        {typeof header === 'function' ? header(close) : header}
      </div>
      <div ref={contentRef} data-sheet-content className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${contentClassName}`} onPointerDown={(event) => { if (event.pointerType === 'mouse' && event.currentTarget.scrollTop === 0) startDrag(event, true) }} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>{children}</div>
      {typeof footer === 'function' ? footer(close) : footer}
    </div>
  </dialog>
}
