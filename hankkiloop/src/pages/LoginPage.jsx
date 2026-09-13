import { useState } from 'react'
import GoogleAccountModal from '../components/login/GoogleAccountModal'
import LoginHeader from '../components/login/LoginHeader'
import LoginUtilityBar from '../components/login/LoginUtilityBar'
import LoginHero from '../components/login/LoginHero'
import GoogleLoginCard from '../components/login/GoogleLoginCard'
import LoginHelpFooter from '../components/login/LoginHelpFooter'

export default function LoginPage({ initialModalOpen = false, account, onAccountContinue }) {
  const [isGoogleAccountModalOpen, setIsGoogleAccountModalOpen] = useState(initialModalOpen)
  const handleGoogleLogin = () => {
    setIsGoogleAccountModalOpen(true)
  }
  const handleBack = () => {
    // TODO: 이전 페이지 이동
  }
  const handleBrowse = () => {
    // TODO: 비로그인 둘러보기
  }
  const handleContact = () => {
    // TODO: 고객센터 연결
  }
  const handleTerms = () => {
    // TODO: 서비스 이용약관 연결
  }
  const handlePrivacy = () => {
    // TODO: 개인정보 처리방침 연결
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#f8f9ff]">
      <div className="mx-auto flex h-full w-full max-w-app flex-col overflow-hidden">
        <LoginHeader onBack={handleBack} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
          <LoginUtilityBar onBack={handleBack} onBrowse={handleBrowse} />
          <LoginHero />
          <GoogleLoginCard onGoogleLogin={handleGoogleLogin} onTerms={handleTerms} onPrivacy={handlePrivacy} />
          <LoginHelpFooter onContact={handleContact} />
        </main>
        {isGoogleAccountModalOpen && (
          <GoogleAccountModal
            onClose={() => setIsGoogleAccountModalOpen(false)}
            account={account}
            onContinue={(selectedAccount) => {
              setIsGoogleAccountModalOpen(false)
              onAccountContinue(selectedAccount)
            }}
            onTerms={handleTerms}
            onPrivacy={handlePrivacy}
          />
        )}
      </div>
    </div>
  )
}
