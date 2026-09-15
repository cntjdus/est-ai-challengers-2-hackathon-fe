import { useState } from 'react'
import LoginHeader from '../components/login/LoginHeader'
import LoginUtilityBar from '../components/login/LoginUtilityBar'
import LoginHero from '../components/login/LoginHero'
import GoogleLoginCard from '../components/login/GoogleLoginCard'
import LoginHelpFooter from '../components/login/LoginHelpFooter'

export default function LoginPage({ onGoogleLogin, busy = false, error = '', configured = false }) {
  const [notice, setNotice] = useState('')
  const showInfo = () => setNotice('한끼루프는 냉장고 재료와 레시피를 비교해 필요한 만큼 장보기를 도와드려요. Google 계정으로 로그인하면 시작할 수 있어요.')
  const showPolicy = (kind) => setNotice(`${kind} 안내를 준비 중이에요.`)
  return (
    <div className="h-dvh overflow-hidden bg-[#f8f9ff]">
      <div className="mx-auto flex h-full w-full max-w-app flex-col overflow-hidden">
        <LoginHeader onBack={showInfo} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
          <LoginUtilityBar onBack={showInfo} onBrowse={showInfo} />
          <LoginHero />
          <GoogleLoginCard onGoogleLogin={onGoogleLogin} busy={busy} disabled={!configured || busy} onTerms={() => showPolicy('서비스 이용약관')} onPrivacy={() => showPolicy('개인정보 처리방침')} />
          {!configured && <p role="status" className="mx-5 mt-4 rounded-2xl border border-[#f1d7ac] bg-[#fff8ee] p-4 text-sm leading-6 text-[#8c5b21]">로그인 연결을 준비 중이에요. 설정이 완료되면 시작할 수 있습니다.</p>}
          {error && <p role="alert" className="mx-5 mt-4 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</p>}
          {notice && <p role="status" className="mx-5 mt-4 rounded-2xl bg-[#e6f4ec] p-4 text-sm leading-6 text-[#1b4535]">{notice}</p>}
          <LoginHelpFooter onContact={() => setNotice('문의 안내를 준비 중이에요.')} />
        </main>
      </div>
    </div>
  )
}
