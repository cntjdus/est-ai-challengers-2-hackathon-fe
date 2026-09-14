import BottomSheet from '../components/common/BottomSheet'
import { useEffect, useRef, useState } from 'react'
import { Camera, Mic, SendHorizontal, TriangleAlert, X } from 'lucide-react'
import HomeHeader from '../components/home/HomeHeader'
import ChatMessage from '../components/chat/ChatMessage'
import { safetyNotice } from '../data/chatMessages'

const chatSnapPoints = [0.7, 0.94]

export default function AIChat({ onNavigate, messages, onMessagesChange, sheet = false, onClose, isLoading = false }) {
  const [input, setInput] = useState('')
  const [notice, setNotice] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const pageRef = useRef(null)
  const shouldScroll = useRef(false)
  useEffect(() => {
    if (sheet) return
    const viewport = window.visualViewport
    const resize = () => {
      if (pageRef.current && viewport) {
        pageRef.current.style.height = viewport.height + 'px'
        pageRef.current.style.top = viewport.offsetTop + 'px'
      }
    }
    resize()
    viewport?.addEventListener('resize', resize)
    viewport?.addEventListener('scroll', resize)
    return () => { viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize) }
  }, [sheet])
  useEffect(() => {
    if (shouldScroll.current) {
      const scroller = endRef.current?.closest('[data-sheet-content]') ?? endRef.current?.closest('main'); scroller?.scrollTo({ top: scroller.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      shouldScroll.current = false
    }
  }, [messages])
  const handleSendMessage = (text = input) => {
    const content = text.trim()
    if (!content || isLoading) return
    const message = { id: crypto.randomUUID(), role: 'user', type: 'text', content, time: new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()) }
    shouldScroll.current = true
    onMessagesChange((current) => [...current, message])
    setInput('')
    // TODO: Backend AI API에 사용자 입력과 대화 이력을 전달하고, 응답으로 받은 질문·답변만 messages에 추가합니다.
  }
  const ContentTag = sheet ? 'div' : 'main'
  const content = (<ContentTag aria-label="AI 대화" className={sheet ? "px-4 pt-3 pb-6" : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-6"}>
      {!sheet && <aside className="flex items-start gap-2 rounded-2xl border border-[#ffdfb2]/70 bg-[#fff8ed] p-3 text-[11px] leading-[18px] text-[#9a5b26]"><TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#c66b43]" /><p>{safetyNotice}</p></aside>}
      <div className="my-4 text-center"><span className="rounded-full bg-[#edf3f0] px-3 py-1 text-[11px] text-[#7c8595]">오늘 대화 시작</span></div>
      <div className="space-y-5">{(messages ?? []).map((message) => <ChatMessage key={message.id} message={message} onQuickReply={handleSendMessage} onNavigate={onNavigate} />)}</div>
      {isLoading && <p role="status" className="mt-3 text-xs text-[#7c8595]">답변을 기다리고 있어요.</p>}<div ref={endRef} />
    </ContentTag>)
  const footer = (<footer className="shrink-0 border-t border-[#f0f1f3] bg-white px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))]">
      {notice && <p role="status" className="mb-2 text-xs text-[#64748b]">{notice}</p>}
      <form onSubmit={(event) => { event.preventDefault(); handleSendMessage() }} className="flex items-center gap-1 rounded-full border border-[#e2e8e5] bg-[#f3f6f4] p-1">
        <button type="button" aria-label="사진 첨부" onClick={() => setNotice('사진 첨부 기능은 준비 중입니다.')} className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#7c8595]"><Camera aria-hidden="true" className="size-4.5" /></button>
        <button type="button" aria-label="음성 입력" onClick={() => setNotice('음성 입력 기능은 준비 중입니다.')} className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#7c8595]"><Mic aria-hidden="true" className="size-4" /></button>
        <input ref={inputRef} aria-label="AI에게 질문" placeholder="식재료 상태나 보관법에 대해 물어보세요" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault() }} className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-xs placeholder:text-[#94a3b8]" />
        <button type="submit" aria-label="메시지 전송" disabled={!input.trim() || isLoading} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1b4535] text-white disabled:opacity-40"><SendHorizontal aria-hidden="true" className="size-4" /></button>
      </form>
    </footer>)
  if (sheet) return <BottomSheet label="AI 채팅" initialHeight={0.7} snapPoints={chatSnapPoints} closeThreshold={0.43} onClose={onClose} contentClassName="bg-[#fafbf9]" header={(close) => <HomeHeader pageLabel="냉큼이 코치" action={<button type="button" aria-label="AI 채팅 닫기" onClick={close} className="flex size-9 items-center justify-center rounded-full text-[#98a2b3]"><X aria-hidden="true" className="size-5" /></button>} />} footer={footer}>{content}</BottomSheet>
  return <div ref={pageRef} className="fixed inset-x-0 top-0 mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafbf9] text-[#1e293b]">
    <HomeHeader pageLabel="냉큼이 코치" onProfile={() => onNavigate('/mypage')} onNotifications={() => setNotice('새로운 알림이 없습니다.')} />
    {content}{footer}
  </div>
}
