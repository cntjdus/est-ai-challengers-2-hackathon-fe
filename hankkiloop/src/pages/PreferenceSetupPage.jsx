import usePreferences from '../hooks/usePreferences'
import { useEffect, useRef } from 'react'
import PreferenceHeader from '../components/preferenceSetup/PreferenceHeader'
import WelcomeCard from '../components/preferenceSetup/WelcomeCard'
import DietaryPreferencesSection from '../components/preferenceSetup/DietaryPreferencesSection'
import AvoidIngredientsSection from '../components/preferenceSetup/AvoidIngredientsSection'
import PreferenceFooter from '../components/preferenceSetup/PreferenceFooter'

export default function PreferenceSetupPage({ account, nickname, initialPreferences, onComplete, busy, error, onBack }) {
  const { preferences, dietaryProps, avoidProps, allergyProps } = usePreferences(initialPreferences)
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])

  const handleStart = () => {
    if (busy) return
    onComplete({ account, nickname, preferences })
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafbf9] outline-none">
      <PreferenceHeader />
      <main aria-label="취향 및 요리 주기 설정" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-6">
        <div className="flex flex-col gap-7">
          <button type="button" onClick={onBack} disabled={busy} className="text-left text-sm text-[#006c49]">← 닉네임 설정으로</button>
          <WelcomeCard />
          <fieldset disabled={busy} className="space-y-7"><DietaryPreferencesSection {...dietaryProps} /><AvoidIngredientsSection {...avoidProps} /><AvoidIngredientsSection {...allergyProps} /></fieldset>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      </main>
      <PreferenceFooter onStart={handleStart} busy={busy} />
    </div>
  )
}
