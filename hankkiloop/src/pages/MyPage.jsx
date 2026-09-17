import { useEffect, useRef, useState } from 'react'
import { authErrorMessage } from '../auth/errors'
import usePreferences from '../hooks/usePreferences'
import useUnsavedChanges from '../hooks/useUnsavedChanges'
import MyPageHeader from '../components/mypage/MyPageHeader'
import ProfileCard from '../components/mypage/ProfileCard'
import DietaryPreferencesSection from '../components/preferenceSetup/DietaryPreferencesSection'
import AvoidIngredientsSection from '../components/preferenceSetup/AvoidIngredientsSection'
import SmartCareCard from '../components/mypage/SmartCareCard'
import BottomNavigation from '../components/common/BottomNavigation'
import PushSettings from '../components/mypage/PushSettings'

export default function MyPage({ account, nickname, initialPreferences, initialAlerts, onEditProfile, onNavigate, onSaveSettings, onSignOut, unitSettings }) {
  const form = usePreferences(initialPreferences)
  const [alerts, setAlerts] = useState(() => ({ expirationAlert: initialAlerts?.expirationAlert ?? false, recipeSuggestionAlert: initialAlerts?.recipeSuggestionAlert ?? false }))
  const [baseline, setBaseline] = useState(() => JSON.stringify({ preferences: form.preferences, alerts }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const working = useRef(false)
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current?.focus() }, [])
  const dirty = form.hasPendingInput || JSON.stringify({ preferences: form.preferences, alerts }) !== baseline
  const confirmLeave = useUnsavedChanges(dirty, busy)
  const save = async () => {
    if (working.current) return
    working.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const draft = { preferences: form.getDraft(), alerts }
      const saved = await onSaveSettings(draft)
      const next = { preferences: saved.preferences, alerts: saved.alerts }
      form.reset(next.preferences); setAlerts(next.alerts); setBaseline(JSON.stringify(next))
      setNotice('설정을 저장했어요.')
    } catch (failure) { setError(authErrorMessage(failure)) }
    finally { working.current = false; setBusy(false) }
  }
  const edit = () => { if (confirmLeave()) onEditProfile({ account, nickname, preferences: initialPreferences, alerts: initialAlerts }) }
  const navigate = path => { if (path !== '/mypage' && confirmLeave()) onNavigate(path) }
  const signOut = async () => {
    if (working.current || !confirmLeave()) return
    working.current = true; setBusy(true); setError(''); setNotice('')
    try { await onSignOut() }
    catch (failure) { setError(authErrorMessage(failure)) }
    finally { working.current = false; setBusy(false) }
  }
  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8f9ff] outline-none">
      <MyPageHeader onSettings={edit} />
      <main aria-label="마이페이지 설정" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-20">
        <div className="flex flex-col gap-3.5">
          <ProfileCard account={account} nickname={nickname} preferences={initialPreferences} onEdit={edit} />
          <fieldset disabled={busy} className="space-y-3.5">
            <DietaryPreferencesSection {...form.dietaryProps} showAddButton />
            <AvoidIngredientsSection {...form.avoidProps} />
            <AvoidIngredientsSection {...form.allergyProps} />
            <SmartCareCard expirationAlert={alerts.expirationAlert} onExpirationChange={value => setAlerts(previous => ({ ...previous, expirationAlert: value }))} recipeSuggestionAlert={alerts.recipeSuggestionAlert} onRecipeChange={value => setAlerts(previous => ({ ...previous, recipeSuggestionAlert: value }))} />
          </fieldset>
          <PushSettings userId={account.id} />
          {unitSettings}
          <p className="text-xs leading-5 text-[#64748b]">식생활과 알림 변경사항은 아래 버튼을 눌러 저장해주세요. 입력 중인 재료도 함께 저장됩니다.</p>
          <button type="button" disabled={busy} onClick={save} className="min-h-12 w-full rounded-xl bg-[#006c49] px-4 py-3 text-sm text-white disabled:opacity-50">{busy ? '처리 중…' : '설정 저장'}</button>
          {(error || form.inputError) && <p role="alert" className="text-sm text-red-700">{error || form.inputError}</p>}
          {!busy && dirty && <p role="status" className="text-xs text-[#64748b]">저장하지 않은 변경사항이 있어요.</p>}
          {!dirty && notice && <p role="status" className="text-sm text-[#006c49]">{notice}</p>}
          <button type="button" disabled={busy} onClick={signOut} className="min-h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#64748b] shadow-xs disabled:opacity-50">로그아웃</button>
        </div>
      </main>
      <BottomNavigation onNavigate={navigate} />
    </div>
  )
}
