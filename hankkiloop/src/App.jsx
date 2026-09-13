import Home from './pages/Home'
import EditProfilePage from './pages/EditProfilePage'
import MyPage from './pages/MyPage'
import PreferenceSetupPage from './pages/PreferenceSetupPage'
import OnboardingPage from './pages/OnboardingPage'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import AccountConsentPage from './pages/AccountConsentPage'
import { defaultGoogleAccount } from './data/googleAccount'

export default function App() {
  const [screen, setScreen] = useState(() => ['/', '/home'].includes(location.pathname) ? 'home' : location.pathname === '/mypage/edit' ? 'edit' : location.pathname === '/mypage' ? 'mypage' : location.pathname === '/onboarding/preferences' ? 'preferences' : 'login')
  const [account, setAccount] = useState(() => history.state?.account ?? defaultGoogleAccount)
  const [nickname, setNickname] = useState(() => history.state?.nickname ?? '자취새싹이')
  const [preferences, setPreferences] = useState(() => history.state?.preferences)
  const handleComplete = (profile) => {
    setAccount(profile.account)
    setNickname(profile.nickname)
    setPreferences(profile.preferences)
    history.replaceState(profile, '', '/mypage')
    setScreen('mypage')
  }
  const [alerts, setAlerts] = useState(() => history.state?.alerts)
  const handleEditProfile = (profile) => {
    setAccount(profile.account)
    setNickname(profile.nickname)
    setPreferences(profile.preferences)
    setAlerts(profile.alerts)
    history.replaceState(profile, '', '/mypage')
    history.pushState({ ...profile, fromMyPage: true }, '', '/mypage/edit')
    setScreen('edit')
  }
  const handleCancelEdit = () => {
    if (history.state?.fromMyPage) history.back()
    else {
      history.replaceState({ account, nickname, preferences, alerts }, '', '/mypage')
      setScreen('mypage')
    }
  }
  const handleSaveProfile = (profile) => {
    handleComplete({ ...profile, alerts })
  }
  const [agreeAll, setAgreeAll] = useState(true)
  useEffect(() => {
    const handlePopState = () => {
      if (history.state?.account) setAccount(history.state.account)
      if (history.state?.nickname !== undefined) setNickname(history.state.nickname)
      setPreferences(history.state?.preferences)
      setAlerts(history.state?.alerts)
      setScreen(['/', '/home'].includes(location.pathname) ? 'home' : location.pathname === '/mypage/edit' ? 'edit' : location.pathname === '/mypage' ? 'mypage' : location.pathname === '/onboarding/preferences' ? 'preferences' : (history.state?.screen ?? 'login'))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const handlePreferences = (draft) => {
    setAccount(draft.account)
    setNickname(draft.nickname)
    setAgreeAll(draft.agreeAll)
    history.replaceState({ screen: 'onboarding' }, '', location.href)
    history.pushState({ account: draft.account, nickname: draft.nickname }, '', '/onboarding/preferences')
    setScreen('preferences')
  }
  const [reopenAccountModal, setReopenAccountModal] = useState(false)

  const handleAccountContinue = (selectedAccount) => {
    setAccount(selectedAccount)
    setScreen('consent')
  }
  const handleChangeAccount = () => {
    setReopenAccountModal(true)
    setScreen('login')
  }

  const handleMainNavigate = (path, currentProfile = { account, nickname, preferences, alerts }) => {
    if (!['/', '/home', '/mypage'].includes(path) || path === location.pathname) return
    setAccount(currentProfile.account)
    setNickname(currentProfile.nickname)
    setPreferences(currentProfile.preferences)
    setAlerts(currentProfile.alerts)
    history.replaceState(currentProfile, '', location.href)
    history.pushState(currentProfile, '', path)
    setScreen(path === '/mypage' ? 'mypage' : 'home')
  }

  if (screen === 'home') return <Home onNavigate={handleMainNavigate} />

  if (screen === 'edit') return <EditProfilePage account={account} nickname={nickname} initialPreferences={preferences} onCancel={handleCancelEdit} onSave={handleSaveProfile} />

  if (screen === 'mypage') return <MyPage onNavigate={handleMainNavigate} onEditProfile={handleEditProfile} initialAlerts={alerts} account={account} nickname={nickname} initialPreferences={preferences} />

  if (screen === 'preferences') return <PreferenceSetupPage onComplete={handleComplete} account={account} nickname={nickname} />

  if (screen === 'onboarding') {
    return <OnboardingPage onContinue={handlePreferences} initialNickname={nickname} initialAgreeAll={agreeAll} account={account} onBack={() => setScreen('consent')} onChangeAccount={handleChangeAccount} />
  }

  return screen === 'consent'
    ? <AccountConsentPage onContinue={(selectedAccount) => { setAccount(selectedAccount); setScreen('onboarding') }} account={account} onChangeAccount={handleChangeAccount} />
    : <LoginPage initialModalOpen={reopenAccountModal} account={account} onAccountContinue={handleAccountContinue} />
}
