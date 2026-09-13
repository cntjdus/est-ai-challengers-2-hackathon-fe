import { useEffect, useRef, useState } from 'react'
import { defaultGoogleAccount } from '../data/googleAccount'
import OnboardingHeader from '../components/onboarding/OnboardingHeader'
import OnboardingGreeting from '../components/onboarding/OnboardingGreeting'
import LinkedAccountCard from '../components/onboarding/LinkedAccountCard'
import AgreementCard from '../components/onboarding/AgreementCard'
import OnboardingGuideCard from '../components/onboarding/OnboardingGuideCard'
import OnboardingFooter from '../components/onboarding/OnboardingFooter'

export default function OnboardingPage({ account, onBack, onChangeAccount, onContinue, initialNickname = '자취새싹이', initialAgreeAll = true }) {
  const selectedAccount = account ?? defaultGoogleAccount
  const [nickname, setNickname] = useState(initialNickname)
  const [agreeAll, setAgreeAll] = useState(initialAgreeAll)
  const canContinue = nickname.trim().length > 0 && agreeAll
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])

  const handleStartPreferenceSetup = () => {
    if (!canContinue) return
    // 선택한 계정과 입력한 닉네임을 다음 단계로 전달합니다.
    onContinue({ account: selectedAccount, nickname: nickname.trim(), agreeAll })
  }
  const handleRequiredTerms = () => {
    // TODO: 서비스 이용약관 상세
  }
  const handleOptionalTerms = () => {
    // TODO: 알림 동의 상세
  }
  const handlePolicy = () => {
    // TODO: 운영 정책 상세
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafbf9] outline-none">
      <OnboardingHeader onBack={onBack} />
      <main aria-label="온보딩 시작" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <div className="flex flex-col gap-4">
          <OnboardingGreeting account={selectedAccount} />
          <LinkedAccountCard account={selectedAccount} nickname={nickname} onNicknameChange={setNickname} onChangeAccount={onChangeAccount} />
          <AgreementCard checked={agreeAll} onChange={setAgreeAll} onRequiredTerms={handleRequiredTerms} onOptionalTerms={handleOptionalTerms} />
          <OnboardingGuideCard />
        </div>
      </main>
      <OnboardingFooter disabled={!canContinue} onContinue={handleStartPreferenceSetup} onPolicy={handlePolicy} />
    </div>
  )
}
