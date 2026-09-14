import NotificationDrawer from './components/notifications/NotificationDrawer'
import { NotificationContext } from './components/notifications/NotificationContext'
import { createExpiryNotifications, createMenuNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './data/notifications'
import IngredientDetail from './pages/IngredientDetail'
import Fridge from './pages/Fridge'
import PackageSolution from './pages/PackageSolution'
import { getPackageOptions, replaceCartItem } from './data/packageOptions'
import MaterialRegister from './pages/MaterialRegister'
import { registerMaterials } from './data/materialRegistration'
import Cart from './pages/Cart'
import { initialCartItems } from './data/cart'
import AIChat from './pages/AIChat'
import FloatingAssistant from './components/common/FloatingAssistant'
import { buildFridgeItems, createMockInventory, deductInventory } from './data/inventory'
import RecipeDetail from './pages/RecipeDetail'
import Recipe from './pages/Recipe'
import Home from './pages/Home'
import EditProfilePage from './pages/EditProfilePage'
import MyPage from './pages/MyPage'
import PreferenceSetupPage from './pages/PreferenceSetupPage'
import OnboardingPage from './pages/OnboardingPage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import LoginPage from './pages/LoginPage'
import AccountConsentPage from './pages/AccountConsentPage'
import { defaultGoogleAccount } from './data/googleAccount'

export default function App() {
  const [screen, setScreen] = useState(() => location.pathname.startsWith('/fridge/') ? 'ingredientDetail' : location.pathname === '/fridge' ? 'fridge' : location.pathname === '/shopping/package-solution' ? 'packageSolution' : location.pathname === '/shopping/register' ? 'register' : location.pathname === '/shopping' ? 'shopping' : location.pathname === '/ai-chat' ? 'aiChat' : location.pathname.startsWith('/recipe/') ? 'recipeDetail' : (location.pathname === '/recipe' || location.pathname === '/recipes') ? 'recipe' : ['/', '/home'].includes(location.pathname) ? 'home' : location.pathname === '/mypage/edit' ? 'edit' : location.pathname === '/mypage' ? 'mypage' : location.pathname === '/onboarding/preferences' ? 'preferences' : 'login')
  const [cartItems, setCartItems] = useState(() => history.state?.cartItems ?? initialCartItems)
  const [registeredMaterials, setRegisteredMaterials] = useState(() => history.state?.registeredMaterials ?? [])
  const [isAIChatOpen, setAIChatOpen] = useState(false)
  const closeAIChat = useCallback(() => { setAIChatOpen(false); requestAnimationFrame(() => document.querySelector('[aria-label="AI 채팅 열기"]')?.focus({ preventScroll: true })) }, [])
  const [isNotificationOpen, setNotificationOpen] = useState(false)
  const [notificationReadIds, setNotificationReadIds] = useState([])
  const [notificationNow] = useState(() => new Date())
  const [recipeSearchKey, setRecipeSearchKey] = useState(0)
  const openNotifications = useCallback(() => { setAIChatOpen(false); setNotificationOpen(true) }, [])
  const closeNotifications = useCallback(() => setNotificationOpen(false), [])
  const [chatMessages, setChatMessages] = useState([])

  const [inventory, setInventory] = useState(() => history.state?.inventory ?? registerMaterials(createMockInventory(), history.state?.registeredMaterials ?? []))
  const notifications = useMemo(() => [...createExpiryNotifications(buildFridgeItems(inventory, registeredMaterials, notificationNow), notificationNow), ...createMenuNotifications(inventory, notificationNow)].map((item) => ({ ...item, isRead: notificationReadIds.includes(item.id) })), [inventory, registeredMaterials, notificationNow, notificationReadIds])
  const handleMarkRead = (id) => setNotificationReadIds((ids) => markNotificationAsRead(ids, id))
  const handleMarkAllRead = () => setNotificationReadIds((ids) => markAllNotificationsAsRead(ids, notifications))
  const handleStockDeduction = (selected) => setInventory(deductInventory(inventory, selected))
  useEffect(() => { history.replaceState({ ...history.state, inventory, registeredMaterials, cartItems }, '', location.href) }, [inventory, registeredMaterials, cartItems, screen])
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
      setNotificationOpen(false)
      setAIChatOpen(false)
      if (history.state?.account) setAccount(history.state.account)
      if (history.state?.nickname !== undefined) setNickname(history.state.nickname)
      setPreferences(history.state?.preferences)
      setAlerts(history.state?.alerts)
      setScreen(location.pathname.startsWith('/fridge/') ? 'ingredientDetail' : location.pathname === '/fridge' ? 'fridge' : location.pathname === '/shopping/package-solution' ? 'packageSolution' : location.pathname === '/shopping/register' ? 'register' : location.pathname === '/shopping' ? 'shopping' : location.pathname === '/ai-chat' ? 'aiChat' : location.pathname.startsWith('/recipe/') ? 'recipeDetail' : (location.pathname === '/recipe' || location.pathname === '/recipes') ? 'recipe' : ['/', '/home'].includes(location.pathname) ? 'home' : location.pathname === '/mypage/edit' ? 'edit' : location.pathname === '/mypage' ? 'mypage' : location.pathname === '/onboarding/preferences' ? 'preferences' : (history.state?.screen ?? 'login'))
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
    if ((!['/', '/home', '/mypage', '/recipe', '/recipes', '/ai-chat', '/shopping', '/fridge'].includes(path) && !/^\/(recipe|fridge)\/[^/]+$/.test(path)) || path === location.pathname) return
    setAIChatOpen(false)
    setNotificationOpen(false)
    setAccount(currentProfile.account)
    setNickname(currentProfile.nickname)
    setPreferences(currentProfile.preferences)
    setAlerts(currentProfile.alerts)
    history.replaceState({ ...history.state, ...currentProfile, cartItems, registeredMaterials, inventory }, '', location.href)
    history.pushState({ ...currentProfile, cartItems, registeredMaterials, inventory, fromApp: true, fromFridge: location.pathname === '/fridge', fromRecipe: isNotificationOpen || isAIChatOpen || location.pathname.startsWith('/fridge/') || ['/recipe', '/recipes', '/ai-chat'].includes(location.pathname) }, '', path)
    setScreen(path.startsWith('/fridge/') ? 'ingredientDetail' : path === '/fridge' ? 'fridge' : path === '/shopping' ? 'shopping' : path === '/ai-chat' ? 'aiChat' : path.startsWith('/recipe/') ? 'recipeDetail' : path === '/mypage' ? 'mypage' : ['/recipe', '/recipes'].includes(path) ? 'recipe' : 'home')
  }

  const handleStartRegistration = (selectedItems) => {
    if (!selectedItems.length) return
    const profile = { account, nickname, preferences, alerts, cartItems, registeredMaterials, inventory }
    history.replaceState({ ...history.state, ...profile }, '', location.href)
    history.pushState({ ...profile, fromShopping: true, registrationId: crypto.randomUUID(), registrationItems: selectedItems }, '', '/shopping/register')
    setScreen('register')
  }
  const handleDirectRegistration = () => {
    history.pushState({ account, nickname, preferences, alerts, cartItems, registeredMaterials, inventory, source: 'fridge-direct', registrationId: crypto.randomUUID() }, '', '/shopping/register')
    setScreen('register')
  }
  const handleRegisterToFridge = (materials) => {
    if (!materials.length || (history.state?.source !== 'fridge-direct' && materials.some((item) => !cartItems.some((cart) => cart.id === item.id)))) throw new Error('장바구니에서 등록할 재료를 다시 선택해주세요.')
    const nextInventory = registerMaterials(inventory, materials)
    const registered = [...registeredMaterials, ...materials.map((item) => ({ ...item, ingredientName: item.ingredientName.trim(), consumedBeforeRegistration: Math.max(0, (createMockInventory()[item.ingredientId] ?? 0) + registeredMaterials.filter((entry) => entry.ingredientId === item.ingredientId).reduce((total, entry) => total + Number(entry.purchaseAmount) * entry.inventoryPerUnit, 0) - (inventory[item.ingredientId] ?? 0)), registeredAt: new Date().toISOString() }))]
    const remaining = cartItems.filter((item) => !materials.some((material) => material.id === item.id))
    setInventory(nextInventory)
    setRegisteredMaterials(registered)
    setCartItems(remaining)
    history.replaceState({ account, nickname, preferences, alerts, cartItems: remaining, registeredMaterials: registered, inventory: nextInventory, registrationMessage: materials.length + '개 재료를 냉장고에 등록했어요.' }, '', '/fridge')
    setScreen('fridge')
  }
  const handleOpenPackageSolution = (item) => {
    if (!item) return
    const profile = { account, nickname, preferences, alerts, cartItems, registeredMaterials, inventory }
    history.replaceState({ ...history.state, ...profile }, '', location.href)
    history.pushState({ ...profile, fromShopping: true, fromRegistration: location.pathname === '/shopping/register', packageItemId: item.id, solutionId: crypto.randomUUID() }, '', '/shopping/package-solution')
    setScreen('packageSolution')
  }
  const handleReplaceCartItem = (itemId, selectedProduct) => {
    const original = cartItems.find((item) => item.id === itemId)
    const product = original && getPackageOptions(original).find((option) => option.id === selectedProduct.id)
    if (!original || !product) throw new Error('장바구니 상품을 다시 확인해주세요.')
    const replacement = replaceCartItem(original, product)
    const nextCart = cartItems.map((item) => item.id === itemId ? replacement : item)
    setCartItems(nextCart)
    history.replaceState({ account, nickname, preferences, alerts, cartItems: nextCart, registeredMaterials, registrationMessage: '선택한 소포장 상품으로 교체했어요.' }, '', '/shopping')
    setScreen('shopping')
  }
  const handleNotificationAction = (action) => {
    setNotificationOpen(false)
    if (action.type === 'ingredient-recipes') {
      setRecipeListState({ tab: 'recipes', category: 'AI 추천 메뉴', query: action.ingredient, search: action.ingredient })
      setRecipeSearchKey((key) => key + 1)
      handleMainNavigate('/recipe')
    } else handleMainNavigate(action.type === 'recipe' ? '/recipe/' + action.recipeId : '/fridge')
  }
  const renderScreen = () => {
  if (screen === 'ingredientDetail') return <IngredientDetail key={location.pathname} itemId={location.pathname.slice('/fridge/'.length)} inventory={inventory} registeredMaterials={registeredMaterials} onNavigate={handleMainNavigate} onBack={() => { if (history.state?.fromFridge) history.back(); else handleMainNavigate('/fridge') }} onBrowseRecipes={(name) => { setRecipeListState({ tab: 'recipes', category: 'AI 추천 메뉴', query: name, search: name }); handleMainNavigate('/recipe') }} />
  if (screen === 'packageSolution') return <PackageSolution key={history.state?.solutionId ?? 'empty'} item={cartItems.find((item) => item.id === history.state?.packageItemId)} onBack={() => { if (history.state?.fromShopping) history.back(); else handleMainNavigate('/shopping') }} onClose={() => { if (history.state?.fromRegistration) history.back(); else handleMainNavigate('/shopping') }} onReplace={handleReplaceCartItem} />
  if (screen === 'register') return <MaterialRegister key={history.state?.registrationId ?? 'empty'} source={history.state?.source} items={history.state?.registrationItems ?? []} onNavigate={handleMainNavigate} onBack={() => { if (history.state?.fromShopping || history.state?.source === 'fridge-direct') history.back(); else handleMainNavigate('/shopping') }} onRegister={handleRegisterToFridge} onOpenPackageSolution={handleOpenPackageSolution} />
  if (screen === 'recipeDetail') return <RecipeDetail registeredMaterials={registeredMaterials} inventory={inventory} onDeductStock={handleStockDeduction} key={location.pathname} recipeId={location.pathname.slice('/recipe/'.length)} savedIds={savedIds} onToggleSave={toggleRecipeSave} onBack={() => { if (history.state?.fromRecipe) history.back(); else handleMainNavigate('/recipe') }} />
  if (screen === 'aiChat') return <AIChat onNavigate={handleMainNavigate} messages={chatMessages} onMessagesChange={setChatMessages} />
  // Main navigation 화면에서만 AI 버튼을 한 번 렌더링합니다.
  const showMainAssistant = ['/', '/home', '/recipe', '/recipes', '/mypage', '/shopping', '/fridge'].includes(location.pathname) && ['home', 'recipe', 'mypage', 'shopping', 'fridge'].includes(screen)
  if (showMainAssistant) return (
    <div className="relative mx-auto h-dvh w-full max-w-app">
      {screen === 'fridge' && <Fridge inventory={inventory} registeredMaterials={registeredMaterials} onNavigate={handleMainNavigate} onAdd={handleDirectRegistration} registrationMessage={history.state?.registrationMessage} />}
      {screen === 'home' && <Home onNavigate={handleMainNavigate} />}
      {screen === 'recipe' && <Recipe key={recipeSearchKey} onNavigate={handleMainNavigate} savedIds={savedIds} onToggleSave={toggleRecipeSave} listState={recipeListState} onListStateChange={setRecipeListState} />}
      {screen === 'mypage' && <MyPage onDraftChange={syncMyPageDraft} onNavigate={handleMainNavigate} onEditProfile={handleEditProfile} initialAlerts={alerts} account={account} nickname={nickname} initialPreferences={preferences} />}
      {screen === 'shopping' && <Cart items={cartItems} onItemsChange={setCartItems} onOpenPackageSolution={handleOpenPackageSolution} onStartRegistration={handleStartRegistration} registrationMessage={history.state?.registrationMessage} onNavigate={handleMainNavigate} onBack={() => { if (history.state?.fromApp) history.back(); else handleMainNavigate('/') }} />}
      <div hidden={isAIChatOpen || isNotificationOpen}><FloatingAssistant onClick={() => { setNotificationOpen(false); setAIChatOpen(true) }} /></div>
      {isAIChatOpen && <AIChat sheet onClose={closeAIChat} onNavigate={handleMainNavigate} messages={chatMessages} onMessagesChange={setChatMessages} />}
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
  return <NotificationContext.Provider value={{ open: openNotifications, isOpen: isNotificationOpen, unreadCount: notifications.filter((item) => !item.isRead).length }}>
    {renderScreen()}
    {isNotificationOpen && <NotificationDrawer notifications={notifications} onClose={closeNotifications} onRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} onAction={handleNotificationAction} />}
  </NotificationContext.Provider>
}
