import AIChat from './pages/AIChat'
import FloatingAssistant from './components/common/FloatingAssistant'
import { createMockInventory, deductInventory } from './data/inventory'
import RecipeDetail from './pages/RecipeDetail'
import Recipe from './pages/Recipe'
import Home from './pages/Home'
import EditProfilePage from './pages/EditProfilePage'
import MyPage from './pages/MyPage'
import PreferenceSetupPage from './pages/PreferenceSetupPage'
import OnboardingPage from './pages/OnboardingPage'
import { useCallback, useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import AccountConsentPage from './pages/AccountConsentPage'
import { defaultGoogleAccount } from './data/googleAccount'

export default function App() {
  const [screen, setScreen] = useState(() => location.pathname === '/ai-chat' ? 'aiChat' : location.pathname.startsWith('/recipe/') ? 'recipeDetail' : (location.pathname === '/recipe' || location.pathname === '/recipes') ? 'recipe' : ['/', '/home'].includes(location.pathname) ? 'home' : location.pathname === '/mypage/edit' ? 'edit' : location.pathname === '/mypage' ? 'mypage' : location.pathname === '/onboarding/preferences' ? 'preferences' : 'login')
  const [chatMessages, setChatMessages] = useState([])

  const [inventory, setInventory] = useState(createMockInventory)
  const handleStockDeduction = (selected) => setInventory(deductInventory(inventory, selected))
  const [savedIds, setSavedIds] = useState([])
  const [recipeListState, setRecipeListState] = useState({})
  const toggleRecipeSave = (id) => setSavedIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id])
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
  const syncMyPageDraft = useCallback((draft) => { setPreferences(draft.preferences); setAlerts(draft.alerts) }, [])
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
      setScreen(location.pathname === '/ai-chat' ? 'aiChat' : location.pathname.startsWith('/recipe/') ? 'recipeDetail' : (location.pathname === '/recipe' || location.pathname === '/recipes') ? 'recipe' : ['/', '/home'].includes(location.pathname) ? 'home' : location.pathname === '/mypage/edit' ? 'edit' : location.pathname === '/mypage' ? 'mypage' : location.pathname === '/onboarding/preferences' ? 'preferences' : (history.state?.screen ?? 'login'))
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
    if ((!['/', '/home', '/mypage', '/recipe', '/recipes', '/ai-chat'].includes(path) && !/^\/recipe\/[^/]+$/.test(path)) || path === location.pathname) return
    setAccount(currentProfile.account)
    setNickname(currentProfile.nickname)
    setPreferences(currentProfile.preferences)
    setAlerts(currentProfile.alerts)
    history.replaceState(currentProfile, '', location.href)
    history.pushState({ ...currentProfile, fromRecipe: ['/recipe', '/recipes', '/ai-chat'].includes(location.pathname) }, '', path)
    setScreen(path === '/ai-chat' ? 'aiChat' : path.startsWith('/recipe/') ? 'recipeDetail' : path === '/mypage' ? 'mypage' : ['/recipe', '/recipes'].includes(path) ? 'recipe' : 'home')
  }

  if (screen === 'recipeDetail') return <RecipeDetail inventory={inventory} onDeductStock={handleStockDeduction} key={location.pathname} recipeId={location.pathname.slice('/recipe/'.length)} savedIds={savedIds} onToggleSave={toggleRecipeSave} onBack={() => { if (history.state?.fromRecipe) history.back(); else handleMainNavigate('/recipe') }} />
  if (screen === 'aiChat') return <AIChat onNavigate={handleMainNavigate} messages={chatMessages} onMessagesChange={setChatMessages} />
  // Main navigation 화면에서만 AI 버튼을 한 번 렌더링합니다.
  const showMainAssistant = ['/', '/home', '/recipe', '/recipes', '/mypage'].includes(location.pathname) && ['home', 'recipe', 'mypage'].includes(screen)
  if (showMainAssistant) return (
    <div className="relative mx-auto h-dvh w-full max-w-app">
      {screen === 'home' && <Home onNavigate={handleMainNavigate} />}
      {screen === 'recipe' && <Recipe onNavigate={handleMainNavigate} savedIds={savedIds} onToggleSave={toggleRecipeSave} listState={recipeListState} onListStateChange={setRecipeListState} />}
      {screen === 'mypage' && <MyPage onDraftChange={syncMyPageDraft} onNavigate={handleMainNavigate} onEditProfile={handleEditProfile} initialAlerts={alerts} account={account} nickname={nickname} initialPreferences={preferences} />}
      <FloatingAssistant onClick={() => handleMainNavigate('/ai-chat')} />
    </div>
  )
  if (screen === 'edit') return <EditProfilePage account={account} nickname={nickname} initialPreferences={preferences} onCancel={handleCancelEdit} onSave={handleSaveProfile} />

  if (screen === 'preferences') return <PreferenceSetupPage onComplete={handleComplete} account={account} nickname={nickname} />

  if (screen === 'onboarding') {
    return <OnboardingPage onContinue={handlePreferences} initialNickname={nickname} initialAgreeAll={agreeAll} account={account} onBack={() => setScreen('consent')} onChangeAccount={handleChangeAccount} />
  }

  return screen === 'consent'
    ? <AccountConsentPage onContinue={(selectedAccount) => { setAccount(selectedAccount); setScreen('onboarding') }} account={account} onChangeAccount={handleChangeAccount} />
    : <LoginPage initialModalOpen={reopenAccountModal} account={account} onAccountContinue={handleAccountContinue} />
}
