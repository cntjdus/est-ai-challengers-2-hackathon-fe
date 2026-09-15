import { useEffect, useRef, useState } from 'react'
import { isValidNickname } from '../utils/profileValidation'
import OnboardingHeader from '../components/onboarding/OnboardingHeader'
import OnboardingGreeting from '../components/onboarding/OnboardingGreeting'
import LinkedAccountCard from '../components/onboarding/LinkedAccountCard'
import AgreementCard from '../components/onboarding/AgreementCard'
import OnboardingGuideCard from '../components/onboarding/OnboardingGuideCard'
import OnboardingFooter from '../components/onboarding/OnboardingFooter'

export default function OnboardingPage({ account, onBack, onChangeAccount, onContinue, initialNickname = '', initialAgreeAll = false, initialNotificationConsent = false }) {
  const selectedAccount = account
  const [nickname, setNickname] = useState(initialNickname)
  const [agreeAll, setAgreeAll] = useState(initialAgreeAll)
  const [notificationConsent, setNotificationConsent] = useState(initialNotificationConsent)
  const [notice, setNotice] = useState('')
  const canContinue = isValidNickname(nickname) && agreeAll
  const pageRef = useRef(null)
  useEffect(() => { pageRef.current.focus() }, [])

  const handleStartPreferenceSetup = () => {
    if (!canContinue) return
    // 선택한 계정과 입력한 닉네임을 다음 단계로 전달합니다.
    onContinue({ account: selectedAccount, nickname: nickname.trim(), agreeAll, notificationConsent })
  }
  const handleRequiredTerms = () => {
    setNotice('서비스 이용약관과 개인정보 처리방침 안내를 준비 중이에요.')
  }
  const handleOptionalTerms = () => {
    setNotice('선택하면 소비기한 임박 알림과 식재료 소진 레시피 제안을 받을 수 있어요. 마이페이지에서 언제든 변경할 수 있습니다.')
  }
  const handlePolicy = () => {
    setNotice('운영 정책 안내를 준비 중이에요.')
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafbf9] outline-none">
      <OnboardingHeader onBack={onBack} />
      <main aria-label="온보딩 시작" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <div className="flex flex-col gap-4">
          <OnboardingGreeting account={selectedAccount} />
          <LinkedAccountCard account={selectedAccount} nickname={nickname} onNicknameChange={setNickname} onChangeAccount={onChangeAccount} />
          <p className="text-xs text-[#64748b]">닉네임은 한글, 영문, 숫자 2~12자로 입력해주세요.</p>
          <AgreementCard notificationConsent={notificationConsent} onNotificationChange={setNotificationConsent} checked={agreeAll} onChange={setAgreeAll} onRequiredTerms={handleRequiredTerms} onOptionalTerms={handleOptionalTerms} />
          <OnboardingGuideCard />
          {notice && <p role="status" className="rounded-xl bg-[#e6f4ec] p-3 text-xs leading-5 text-[#1b4535]">{notice}</p>}
        </div>
      </main>
      <OnboardingFooter disabled={!canContinue} onContinue={handleStartPreferenceSetup} onPolicy={handlePolicy} />
    </div>
  )
}
