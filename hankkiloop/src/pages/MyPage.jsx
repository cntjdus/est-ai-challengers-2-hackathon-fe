import { useEffect, useRef, useState } from 'react'
import { defaultGoogleAccount } from '../data/googleAccount'
import usePreferences from '../hooks/usePreferences'
import MyPageHeader from '../components/mypage/MyPageHeader'
import ProfileCard from '../components/mypage/ProfileCard'
import DietaryPreferencesSection from '../components/preferenceSetup/DietaryPreferencesSection'
import AvoidIngredientsSection from '../components/preferenceSetup/AvoidIngredientsSection'
import SmartCareCard from '../components/mypage/SmartCareCard'
import BottomNavigation from '../components/common/BottomNavigation'

export default function MyPage({ account = defaultGoogleAccount, nickname = '자취새싹이', initialPreferences, onEditProfile, initialAlerts, onNavigate }) {
  const { preferences, dietaryProps, avoidProps } = usePreferences(initialPreferences)
  const [expirationAlert, setExpirationAlert] = useState(initialAlerts?.expirationAlert ?? true)
  const [recipeSuggestionAlert, setRecipeSuggestionAlert] = useState(initialAlerts?.recipeSuggestionAlert ?? true)
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])

  const handleEditProfile = () => {
    onEditProfile({ account, nickname, preferences, alerts: { expirationAlert, recipeSuggestionAlert } })
  }
  const handleNavigate = (path) => {
    if (path === '/mypage') return
    onNavigate(path, { account, nickname, preferences, alerts: { expirationAlert, recipeSuggestionAlert } })
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8f9ff] outline-none">
      <MyPageHeader onSettings={handleEditProfile} />
      <main aria-label="마이페이지 설정" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-8">
        <div className="flex flex-col gap-3.5">
          <ProfileCard account={account} nickname={nickname} preferences={preferences} onEdit={handleEditProfile} />
          <DietaryPreferencesSection {...dietaryProps} />
          <AvoidIngredientsSection {...avoidProps} />
          <SmartCareCard expirationAlert={expirationAlert} onExpirationChange={setExpirationAlert} recipeSuggestionAlert={recipeSuggestionAlert} onRecipeChange={setRecipeSuggestionAlert} />
        </div>
      </main>
      <BottomNavigation onNavigate={handleNavigate} />
    </div>
  )
}
