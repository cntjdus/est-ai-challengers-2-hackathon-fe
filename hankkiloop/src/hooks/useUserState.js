import { useCallback, useEffect, useRef, useState } from 'react'
import { loadSavedRecipes, loadNotificationReads, setRecipeSaved, saveNotificationReads } from '../data/userStateApi'

export default function useUserState(client, userId) {
  const [savedIds, setSavedIds] = useState([])
  const [readIds, setReadIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyIds, setBusyIds] = useState([])
  const locks = useRef(new Set())
  const readWrites = useRef(0)
  const ready = useRef(false)
  const version = useRef(0)
  const alive = useRef(true)
  const savedRef = useRef([])
  const reload = useCallback(async () => {
    if (locks.current.size || readWrites.current) return
    const request = ++version.current
    try {
      const [saved, reads] = await Promise.all([loadSavedRecipes(client, userId), loadNotificationReads(client, userId)])
      if (!alive.current || request !== version.current) return
      savedRef.current = saved; setSavedIds(saved); setReadIds(reads); setError(''); ready.current = true
    } catch (e) { if (alive.current && request === version.current) setError('저장 상태를 불러오지 못했어요. ' + e.message) }
    finally { if (alive.current && request === version.current) setLoading(false) }
  }, [client, userId])
  useEffect(() => {
    alive.current = true
    queueMicrotask(() => { if (alive.current) reload() })
    const refresh = () => { if (document.visibilityState === 'visible') reload() }
    document.addEventListener('visibilitychange', refresh)
    return () => { alive.current = false; document.removeEventListener('visibilitychange', refresh) }
  }, [reload])
  const toggleSave = async id => {
    if (!ready.current) { setError('스크랩 목록을 먼저 불러와 주세요.'); return }
    if (locks.current.has(id)) return
    locks.current.add(id); setBusyIds([...locks.current]); version.current++
    const saved = !savedRef.current.includes(id)
    try {
      await setRecipeSaved(client, userId, id, saved)
      if (!alive.current) return
      savedRef.current = saved ? [...new Set([...savedRef.current, id])] : savedRef.current.filter(x => x !== id)
      setSavedIds(savedRef.current); setError('')
    } catch (e) { if (alive.current) setError('스크랩 저장 실패: ' + e.message) }
    finally { locks.current.delete(id); if (alive.current) setBusyIds([...locks.current]) }
  }
  const markRead = async ids => {
    if (!ready.current) { setError('알림 읽음 상태를 먼저 불러와 주세요.'); return }
    version.current++; readWrites.current++
    try {
      await saveNotificationReads(client, userId, ids)
      if (alive.current) { setReadIds(old => [...new Set([...old, ...ids])]); setError('') }
    } catch (e) { if (alive.current) setError('읽음 상태 저장 실패: ' + e.message) }
    finally { readWrites.current-- }
  }
  return { savedIds, readIds, loading, error, busyIds, toggleSave, markRead, reload }
}
