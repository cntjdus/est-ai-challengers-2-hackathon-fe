import { useEffect, useRef, useState } from 'react'
import { authErrorMessage } from '../auth/errors'
import usePreferences from '../hooks/usePreferences'
import MyPageHeader from '../components/mypage/MyPageHeader'
import ProfileCard from '../components/mypage/ProfileCard'
import DietaryPreferencesSection from '../components/preferenceSetup/DietaryPreferencesSection'
import AvoidIngredientsSection from '../components/preferenceSetup/AvoidIngredientsSection'
import SmartCareCard from '../components/mypage/SmartCareCard'
import BottomNavigation from '../components/common/BottomNavigation'

export default function MyPage({ account, nickname = '자취새싹이', initialPreferences, onEditProfile, initialAlerts, onNavigate, onSaveSettings, onSignOut }) {
  const { preferences, dietaryProps, avoidProps } = usePreferences(initialPreferences)
  const [expirationAlert, setExpirationAlert] = useState(initialAlerts?.expirationAlert ?? true)
  const [recipeSuggestionAlert, setRecipeSuggestionAlert] = useState(initialAlerts?.recipeSuggestionAlert ?? false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const working = useRef(false)
  const runAction = async (action, message) => {
    if (working.current) return
    working.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try { await action(); setNotice(message) }
    catch (failure) { setError(authErrorMessage(failure)) }
    finally { working.current = false; setBusy(false) }
  }
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])

  const handleEditProfile = () => {
    onEditProfile({ account, nickname, preferences: initialPreferences, alerts: initialAlerts })
  }
  const handleNavigate = (path) => {
    if (path === '/mypage') return
    onNavigate(path)
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8f9ff] outline-none">
      <MyPageHeader onSettings={handleEditProfile} />
      <main aria-label="마이페이지 설정" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-20">
        <div className="flex flex-col gap-3.5">
          <ProfileCard account={account} nickname={nickname} preferences={preferences} onEdit={handleEditProfile} />
          <fieldset disabled={busy} className="space-y-3.5">
          <DietaryPreferencesSection {...dietaryProps} />
          <AvoidIngredientsSection {...avoidProps} />
          <SmartCareCard expirationAlert={expirationAlert} onExpirationChange={setExpirationAlert} recipeSuggestionAlert={recipeSuggestionAlert} onRecipeChange={setRecipeSuggestionAlert} />
          <button type="button" onClick={() => runAction(() => onSaveSettings({ preferences, alerts: { expirationAlert, recipeSuggestionAlert } }), '설정을 저장했어요.')} className="min-h-12 w-full rounded-xl bg-[#006c49] px-4 py-3 text-sm text-white">{busy ? '처리 중…' : '설정 저장'}</button>
          </fieldset>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="text-sm text-[#006c49]">{notice}</p>}
          <button type="button" disabled={busy} onClick={() => runAction(onSignOut, '')} className="min-h-11 rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#64748b]">로그아웃</button>
        </div>
      </main>
      <BottomNavigation onNavigate={handleNavigate} />
    </div>
  )
}
