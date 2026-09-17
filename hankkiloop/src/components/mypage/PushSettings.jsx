import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { enablePush, disablePush, isPushEnabled, pushSupported } from '../../data/pushApi'
import bell from '../../assets/icons/smart-care-bell.svg'

export default function PushSettings({ userId }) {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const locked = useRef(false)
  useEffect(() => {
    let active = true
    isPushEnabled(supabase, userId).then(value => { if (active) setEnabled(value) }).catch(() => { if (active) setMessage('수신 상태를 확인하지 못했어요. 다시 켜거나 끌 수 있어요.') })
    return () => { active = false }
  }, [userId])
  const toggle = async () => {
    if (locked.current) return
    locked.current = true; setBusy(true); setMessage('')
    try {
      if (enabled) await disablePush(supabase, userId)
      else await enablePush(supabase, userId)
      setEnabled(!enabled); setMessage(enabled ? '이 기기의 푸시를 껐어요.' : '이 기기의 푸시를 켰어요. 위에서 원하는 알림 종류도 저장해주세요.')
    } catch (e) { setMessage(e.message) }
    finally { locked.current = false; setBusy(false) }
  }
  return <section aria-labelledby="device-push-heading" className="space-y-3 rounded-2xl border border-[#e2e8f0]/80 bg-white p-[17px] shadow-xs">
    <h2 id="device-push-heading" className="flex items-center gap-2 text-[17px] leading-6 text-[#161c25]"><img src={bell} alt="" className="size-[16.7px]" />기기 및 알림 설정</h2>
    <div className="flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-3">
      <div className="min-w-0"><h3 className="text-sm leading-5 text-[#161c25]">이 기기 푸시 알림</h3><p className="mt-0.5 text-[11px] leading-4 text-[#3c4a42]">앱을 닫아도 켜 둔 종류의 알림을 받아요.</p></div>
      <button type="button" disabled={busy || !pushSupported()} onClick={toggle} className="min-h-11 shrink-0 rounded-xl border border-[#b8ded0] bg-[#ecfdf5] px-3 text-xs font-semibold text-[#006c49] disabled:opacity-40">{busy ? '설정 중…' : enabled ? '푸시 끄기' : '푸시 켜기'}</button>
    </div>
    <p className="text-[11px] leading-4 text-[#64748b]">로그아웃하면 이 기기의 수신이 해제됩니다.</p>
    {!pushSupported() && <p className="rounded-xl bg-[#fff8ee] px-3 py-2 text-[11px] leading-4 text-[#8c5b21]">HTTPS에서 지원되는 브라우저로 열어주세요. iPhone은 홈 화면에 추가해야 해요.</p>}
    {message && <p role="status" className="rounded-xl bg-[#f1f5f9] px-3 py-2 text-[11px] leading-4 text-[#64748b]">{message}</p>}
  </section>
}
