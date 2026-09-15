import arrow from '../../assets/icons/continue-arrow.svg'
export default function PreferenceFooter({ onStart, busy }) {
  return <footer className="shrink-0 bg-linear-to-t from-[#fafbf9] via-[#fafbf9] to-[#fafbf9]/80 px-5 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]"><button type="button" onClick={onStart} disabled={busy} aria-busy={busy} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1b4d3e] text-base text-white shadow-[0_4px_6px_-1px_rgba(27,77,62,0.15)] hover:bg-[#153e32]">{busy ? '저장 중…' : '한끼루프 시작하기'}<img src={arrow} alt="" className="size-4" /></button></footer>
}
