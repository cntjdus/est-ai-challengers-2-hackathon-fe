import usePreferences from '../hooks/usePreferences'
import { useEffect, useRef } from 'react'
import { defaultGoogleAccount } from '../data/googleAccount'
import PreferenceHeader from '../components/preferenceSetup/PreferenceHeader'
import WelcomeCard from '../components/preferenceSetup/WelcomeCard'
import DietaryPreferencesSection from '../components/preferenceSetup/DietaryPreferencesSection'
import AvoidIngredientsSection from '../components/preferenceSetup/AvoidIngredientsSection'
import PreferenceFooter from '../components/preferenceSetup/PreferenceFooter'

export default function PreferenceSetupPage({ account = defaultGoogleAccount, nickname = '자취새싹이', onComplete }) {
  const { preferences, dietaryProps, avoidProps } = usePreferences()
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])

  const handleStart = () => {
    // TODO: 백엔드에 온보딩 설정 저장
    onComplete({ account, nickname, preferences })
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafbf9] outline-none">
      <PreferenceHeader />
      <main aria-label="취향 및 요리 주기 설정" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-6">
        <div className="flex flex-col gap-7">
          <WelcomeCard />
          <DietaryPreferencesSection {...dietaryProps} />
          <AvoidIngredientsSection {...avoidProps} />
        </div>
      </main>
      <PreferenceFooter onStart={handleStart} />
    </div>
  )
}
