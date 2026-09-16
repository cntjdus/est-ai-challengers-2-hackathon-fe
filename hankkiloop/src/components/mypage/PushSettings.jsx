import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { enablePush, disablePush, isPushEnabled, pushSupported } from '../../data/pushApi'

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
  return <section className="space-y-2 rounded-2xl bg-white p-4"><h2 className="font-semibold">이 기기 푸시 알림</h2><p className="text-xs text-slate-600">앱을 닫아도 켜 둔 종류의 알림을 받아요. 로그아웃하면 이 기기의 수신이 해제됩니다.</p><button type="button" disabled={busy || !pushSupported()} onClick={toggle} className="rounded border px-3 py-2 text-sm disabled:opacity-40">{busy ? '설정 중…' : enabled ? '푸시 끄기' : '푸시 켜기'}</button>{!pushSupported() && <p className="text-xs">HTTPS에서 지원되는 브라우저로 열어주세요. iPhone은 홈 화면에 추가해야 해요.</p>}{message && <p role="status" className="text-xs">{message}</p>}</section>
}
