import { useEffect, useRef } from 'react'
import AccountConsentHeader from '../components/accountConsent/AccountConsentHeader'
import AccountConsentHero from '../components/accountConsent/AccountConsentHero'
import SelectedAccountCard from '../components/accountConsent/SelectedAccountCard'
import PermissionScopeCard from '../components/accountConsent/PermissionScopeCard'
import ConsentFooter from '../components/accountConsent/ConsentFooter'
import { defaultGoogleAccount } from '../data/googleAccount'

export default function AccountConsentPage({ account, onChangeAccount, onContinue }) {
  const selectedAccount = account ?? defaultGoogleAccount
  const pageRef = useRef(null)
  useEffect(() => {
    pageRef.current.focus()
  }, [])

  const handleConsent = () => {
    // TODO: 실제 Google 연동 동의 API 연결
    onContinue(selectedAccount)
  }
  const handleTerms = () => {
    // TODO: 서비스 이용약관 연결
  }
  const handlePrivacy = () => {
    // TODO: 개인정보처리방침 연결
  }

  return (
    <div ref={pageRef} tabIndex={-1} className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8fafd] outline-none">
      <AccountConsentHeader onBack={onChangeAccount} />
      <main aria-label="계정 연동 안내" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-6">
        <div className="flex flex-col gap-[15.4px]">
          <AccountConsentHero />
          <SelectedAccountCard account={selectedAccount} />
          <PermissionScopeCard />
          <p className="px-2 text-center text-[11px] leading-[17.88px] text-[#9ca3af]">
            계속 진행하면 한끼루프의{' '}
            <button type="button" onClick={handleTerms} className="font-medium text-[#4b5563] underline">서비스 이용약관</button> 및{' '}
            <button type="button" onClick={handlePrivacy} className="font-medium text-[#4b5563] underline">개인정보처리방침</button>에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </main>
      <ConsentFooter onConsent={handleConsent} onChangeAccount={onChangeAccount} />
    </div>
  )
}
