import { createUserHistory } from './auth/navigation'
import NotificationDrawer from './components/notifications/NotificationDrawer'
import { NotificationContext } from './components/notifications/NotificationContext'
import { createExpiryNotifications, createMenuNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './data/notifications'
import IngredientDetail from './pages/IngredientDetail'
import Fridge from './pages/Fridge'
import PackageSolution from './pages/PackageSolution'

import { getPackageOptions, replaceCartItem } from './data/packageOptions'
import MaterialRegister from './pages/MaterialRegister'
import { supabase } from './lib/supabase'
import { loadInventory, registerInventory, toRegistrationPayload, saveInventoryItem, planDeductions, changeInventoryBatch } from './data/fridgeApi'
import Cart from './pages/Cart'
import { initialCartItems } from './data/cart'
import AIChat from './pages/AIChat'
import FloatingAssistant from './components/common/FloatingAssistant'
import { buildFridgeItems } from './data/inventory'
import RecipeDetail from './pages/RecipeDetail'
import Recipe from './pages/Recipe'
import Home from './pages/Home'
import EditProfilePage from './pages/EditProfilePage'
import MyPage from './pages/MyPage'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const PackageMap = lazy(() => import('./pages/PackageMap'))

export default function App({ initialProfile, onSaveProfile, onSignOut }) {
  const history = useMemo(() => createUserHistory(initialProfile.account.id), [initialProfile.account.id])
  const [screen, setScreen] = useState(() => location.pathname.startsWith('/fridge/') ? 'ingredientDetail' : location.pathname === '/fridge' ? 'fridge' : location.pathname === '/shopping/package-solution/map' ? 'packageMap' : location.pathname === '/shopping/package-solution' ? 'packageSolution' : location.pathname === '/shopping/register' ? 'register' : location.pathname === '/shopping' ? 'shopping' : location.pathname === '/ai-chat' ? 'aiChat' : location.pathname.startsWith('/recipe/') ? 'recipeDetail' : (location.pathname === '/recipe' || location.pathname === '/recipes') ? 'recipe' : ['/', '/home'].includes(location.pathname) ? 'home' : location.pathname === '/mypage/edit' ? 'edit' : location.pathname === '/mypage' ? 'mypage' : location.pathname === '/onboarding/preferences' ? 'preferences' : 'login')
  const [cartItems, setCartItems] = useState(() => history.readState()?.cartItems ?? initialCartItems)
  const [registeredMaterials, setRegisteredMaterials] = useState(() => Object.assign([], { database: true }))
  const [isAIChatOpen, setAIChatOpen] = useState(false)
  const closeAIChat = useCallback(() => setAIChatOpen(false), [])
  const wasAIChatOpen = useRef(false)
  useLayoutEffect(() => {
    const shouldRestore = wasAIChatOpen.current && !isAIChatOpen
    wasAIChatOpen.current = isAIChatOpen
    if (!shouldRestore) return
    document.querySelector('[aria-label="AI 채팅 열기"]')?.focus({ preventScroll: true })
  }, [isAIChatOpen])
  const [isNotificationOpen, setNotificationOpen] = useState(false)
  const [notificationReadIds, setNotificationReadIds] = useState([])
  const [notificationNow] = useState(() => new Date())
  const [recipeSearchKey, setRecipeSearchKey] = useState(0)
  const openNotifications = useCallback(() => { setAIChatOpen(false); setNotificationOpen(true) }, [])
  const closeNotifications = useCallback(() => setNotificationOpen(false), [])
  const [chatMessages, setChatMessages] = useState([])

  const [inventory, setInventory] = useState({})
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState('')
  const inventoryLoaded = useRef(false)
  const [inventoryReady, setInventoryReady] = useState(false)
  const inventoryRequest = useRef(0)
  const reloadInventory = useCallback(async () => {
    const request = ++inventoryRequest.current
    if (!inventoryLoaded.current) setInventoryLoading(true); setInventoryError('')
    try {
      const result = await loadInventory(supabase, initialProfile.account.id)
      if (request !== inventoryRequest.current) return
      inventoryLoaded.current = true
      setInventoryReady(true)
      setInventory(result.inventory); setRegisteredMaterials(result.registrations)
    } catch (error) {
      if (request === inventoryRequest.current) setInventoryError('냉장고를 불러오지 못했어요. ' + (error.message || '잠시 후 다시 시도해주세요.'))
      throw error
    } finally { if (request === inventoryRequest.current) setInventoryLoading(false) }
  }, [initialProfile.account.id])
  useEffect(() => {
    let disposed = false
    queueMicrotask(() => { if (!disposed) reloadInventory().catch(() => {}) })
    const refresh = () => { if (document.visibilityState === 'visible') reloadInventory().catch(() => {}) }
    document.addEventListener('visibilitychange', refresh)
    return () => { disposed = true; document.removeEventListener('visibilitychange', refresh) }
  }, [reloadInventory])
  const pendingDeduction = useRef(null)
  const handleStockDeduction = async (selected) => {
    const key = JSON.stringify(selected)
    if (pendingDeduction.current?.key !== key) pendingDeduction.current = { key, changes: planDeductions(registeredMaterials, selected) }
    await changeInventoryBatch(supabase, pendingDeduction.current.changes)
    await reloadInventory()
    pendingDeduction.current = null
  }
  const handleUpdateItem = async (id, draft) => {
    const material = registeredMaterials.find(m => m.id === id)
    if (!material) throw new Error('재료를 다시 확인해주세요.')
    await saveInventoryItem(supabase, material.dbRow, draft)
    await reloadInventory()
  }
  const pendingRemoval = useRef(null)
  const handleRemoveItem = async (id) => {
    const material = registeredMaterials.find(m => m.id === id)
    if (!material) throw new Error('재료를 다시 확인해주세요.')
    if (pendingRemoval.current?.id !== id) pendingRemoval.current = { id, delta: -material.purchaseAmount, status: 'discarded', request_id: crypto.randomUUID() }
    await changeInventoryBatch(supabase, [pendingRemoval.current])
    await reloadInventory()
    pendingRemoval.current = null
    handleMainNavigate('/fridge')
  }
  const notifications = useMemo(() => [...createExpiryNotifications(buildFridgeItems(inventory, registeredMaterials, notificationNow), notificationNow), ...createMenuNotifications(inventory, notificationNow)].map((item) => ({ ...item, isRead: notificationReadIds.includes(item.id) })), [inventory, registeredMaterials, notificationNow, notificationReadIds])
  const handleMarkRead = (id) => setNotificationReadIds((ids) => markNotificationAsRead(ids, id))
  const handleMarkAllRead = () => setNotificationReadIds((ids) => markAllNotificationsAsRead(ids, notifications))
  useEffect(() => { history.replaceState({ ...history.readState(), inventory, registeredMaterials, cartItems }, '', location.href) }, [inventory, registeredMaterials, cartItems, screen, history])
  const [savedIds, setSavedIds] = useState([])
  const [recipeListState, setRecipeListState] = useState({})
  const toggleRecipeSave = (id) => setSavedIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id])
  const [account, setAccount] = useState(initialProfile.account)
  const [nickname, setNickname] = useState(initialProfile.nickname)
  const [preferences, setPreferences] = useState(initialProfile.preferences)
  const [alerts, setAlerts] = useState(initialProfile.alerts)
  const handleSaveSettings = async (draft) => {
    const saved = await onSaveProfile({ nickname, preferences: draft.preferences, alerts: draft.alerts })
    setPreferences(saved.preferences)
    setAlerts(saved.alerts)
  }
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
    if (history.readState()?.fromMyPage) history.back()
    else {
      history.replaceState({ account, nickname, preferences, alerts }, '', '/mypage')
      setScreen('mypage')
    }
  }
  const handleSaveProfile = async (draft) => {
    const saved = await onSaveProfile({ ...draft, alerts })
    setAccount(saved.account)
    setNickname(saved.nickname)
    setPreferences(saved.preferences)
    history.replaceState({}, '', '/mypage')
    setScreen('mypage')
  }
  useEffect(() => {
    const handlePopState = () => {
      history.replaceState(history.readState() ?? {}, '', location.href)
      setNotificationOpen(false)
      setAIChatOpen(false)
      setScreen(location.pathname.startsWith('/fridge/') ? 'ingredientDetail' : location.pathname === '/fridge' ? 'fridge' : location.pathname === '/shopping/package-solution/map' ? 'packageMap' : location.pathname === '/shopping/package-solution' ? 'packageSolution' : location.pathname === '/shopping/register' ? 'register' : location.pathname === '/shopping' ? 'shopping' : location.pathname === '/ai-chat' ? 'aiChat' : location.pathname.startsWith('/recipe/') ? 'recipeDetail' : (location.pathname === '/recipe' || location.pathname === '/recipes') ? 'recipe' : ['/', '/home'].includes(location.pathname) ? 'home' : location.pathname === '/mypage/edit' ? 'edit' : location.pathname === '/mypage' ? 'mypage' : location.pathname === '/onboarding/preferences' ? 'preferences' : (history.readState()?.screen ?? 'login'))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [history])
  const handleMainNavigate = (path, currentProfile = { account, nickname, preferences, alerts }) => {
    if ((!['/', '/home', '/mypage', '/recipe', '/recipes', '/ai-chat', '/shopping', '/fridge'].includes(path) && !/^\/(recipe|fridge)\/[^/]+$/.test(path)) || path === location.pathname) return
    setAIChatOpen(false)
    setNotificationOpen(false)
    setAccount(currentProfile.account)
    setNickname(currentProfile.nickname)
    setPreferences(currentProfile.preferences)
    setAlerts(currentProfile.alerts)
    history.replaceState({ ...history.readState(), ...currentProfile, cartItems, registeredMaterials, inventory }, '', location.href)
    history.pushState({ ...currentProfile, cartItems, registeredMaterials, inventory, fromApp: true, fromFridge: location.pathname === '/fridge', fromRecipe: isNotificationOpen || isAIChatOpen || location.pathname.startsWith('/fridge/') || ['/recipe', '/recipes', '/ai-chat'].includes(location.pathname) }, '', path)
    setScreen(path.startsWith('/fridge/') ? 'ingredientDetail' : path === '/fridge' ? 'fridge' : path === '/shopping' ? 'shopping' : path === '/ai-chat' ? 'aiChat' : path.startsWith('/recipe/') ? 'recipeDetail' : path === '/mypage' ? 'mypage' : ['/recipe', '/recipes'].includes(path) ? 'recipe' : 'home')
  }

  const handleStartRegistration = (selectedItems) => {
    if (!selectedItems.length) return
    const profile = { account, nickname, preferences, alerts, cartItems, registeredMaterials, inventory }
    history.replaceState({ ...history.readState(), ...profile }, '', location.href)
    history.pushState({ ...profile, fromShopping: true, registrationId: crypto.randomUUID(), registrationItems: selectedItems }, '', '/shopping/register')
    setScreen('register')
  }
  const handleDirectRegistration = () => {
    history.pushState({ account, nickname, preferences, alerts, cartItems, registeredMaterials, inventory, source: 'fridge-direct', registrationId: crypto.randomUUID() }, '', '/shopping/register')
    setScreen('register')
  }
  const registrationRequest = useRef(null)
  const handleRegisterToFridge = async (materials) => {
    if (!materials.length) throw new Error('등록할 재료가 없습니다.')
    const key = JSON.stringify(materials)
    if (registrationRequest.current?.key !== key) registrationRequest.current = { key, payload: toRegistrationPayload(materials, materials.map(() => crypto.randomUUID())) }
    await registerInventory(supabase, registrationRequest.current.payload)
    await reloadInventory()
    const remaining = cartItems.filter(item => !materials.some(m => m.id === item.id))
    setCartItems(remaining)
    registrationRequest.current = null
    history.replaceState({ registrationMessage: materials.length + '개 재료를 냉장고에 등록했어요.' }, '', '/fridge')
    setScreen('fridge')
  }
  const handleOpenPackageSolution = (item) => {
    if (!item) return
    const profile = { account, nickname, preferences, alerts, cartItems, registeredMaterials, inventory }
    history.replaceState({ ...history.readState(), ...profile }, '', location.href)
    history.pushState({ ...profile, fromShopping: true, fromRegistration: location.pathname === '/shopping/register', packageItemId: item.id, solutionId: crypto.randomUUID() }, '', '/shopping/package-solution')
    setScreen('packageSolution')
  }
  const handleOpenPackageMap = (packageView) => {
    const state = { ...history.readState(), cartItems, registeredMaterials, inventory, packageView }
    history.replaceState(state, '', location.href)
    history.pushState({ ...state, fromPackageSolution: true }, '', '/shopping/package-solution/map')
    setScreen('packageMap')
  }
  const handleClosePackageMap = () => {
    if (history.readState()?.fromPackageSolution) history.back()
    else {
      history.replaceState({ ...history.readState() }, '', '/shopping/package-solution')
      setScreen('packageSolution')
    }
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
  if (screen === 'ingredientDetail') return <IngredientDetail onUpdate={handleUpdateItem} onRemove={handleRemoveItem} key={location.pathname} itemId={location.pathname.slice('/fridge/'.length)} inventory={inventory} registeredMaterials={registeredMaterials} onNavigate={handleMainNavigate} onBack={() => { if (history.readState()?.fromFridge) history.back(); else handleMainNavigate('/fridge') }} onBrowseRecipes={(name) => { setRecipeListState({ tab: 'recipes', category: 'AI 추천 메뉴', query: name, search: name }); handleMainNavigate('/recipe') }} />
  if (screen === 'packageMap') return <Suspense fallback={<div role="status" className="mx-auto flex h-dvh max-w-app items-center justify-center bg-white text-sm text-[#007451]">지도를 불러오는 중…</div>}><PackageMap key={history.readState()?.solutionId ?? 'empty'} item={cartItems.find((item) => item.id === history.readState()?.packageItemId)} selectedProductId={history.readState()?.packageView?.selectedProductId} onBack={handleClosePackageMap} onReplace={handleReplaceCartItem} /></Suspense>
  if (screen === 'packageSolution') return <PackageSolution key={history.readState()?.solutionId ?? 'empty'} item={cartItems.find((item) => item.id === history.readState()?.packageItemId)} onBack={() => { if (history.readState()?.fromShopping) history.back(); else handleMainNavigate('/shopping') }} onClose={() => { if (history.readState()?.fromRegistration) history.back(); else handleMainNavigate('/shopping') }} onOpenMap={handleOpenPackageMap} onReplace={handleReplaceCartItem} />
  if (screen === 'register') return <MaterialRegister key={history.readState()?.registrationId ?? 'empty'} source={history.readState()?.source} items={history.readState()?.registrationItems ?? []} onNavigate={handleMainNavigate} onBack={() => { if (history.readState()?.fromShopping || history.readState()?.source === 'fridge-direct') history.back(); else handleMainNavigate('/shopping') }} onRegister={handleRegisterToFridge} onOpenPackageSolution={handleOpenPackageSolution} />
  if (screen === 'recipeDetail') return <RecipeDetail registeredMaterials={registeredMaterials} inventory={inventory} onDeductStock={handleStockDeduction} key={location.pathname} recipeId={location.pathname.slice('/recipe/'.length)} savedIds={savedIds} onToggleSave={toggleRecipeSave} onBack={() => { if (history.readState()?.fromRecipe) history.back(); else handleMainNavigate('/recipe') }} />
  if (screen === 'aiChat') return <AIChat onNavigate={handleMainNavigate} messages={chatMessages} onMessagesChange={setChatMessages} />
  // Main navigation 화면에서만 AI 버튼을 한 번 렌더링합니다.
  const showMainAssistant = ['/', '/home', '/recipe', '/recipes', '/mypage', '/shopping', '/fridge'].includes(location.pathname) && ['home', 'recipe', 'mypage', 'shopping', 'fridge'].includes(screen)
  if (showMainAssistant) return (
    <div className="relative mx-auto h-dvh w-full max-w-app">
      {screen === 'fridge' && <Fridge inventory={inventory} registeredMaterials={registeredMaterials} onNavigate={handleMainNavigate} onAdd={handleDirectRegistration} registrationMessage={history.readState()?.registrationMessage} />}
      {screen === 'home' && <Home fridgeItems={buildFridgeItems(inventory, registeredMaterials)} nickname={nickname} onNavigate={handleMainNavigate} />}
      {screen === 'recipe' && <Recipe key={recipeSearchKey} onNavigate={handleMainNavigate} savedIds={savedIds} onToggleSave={toggleRecipeSave} listState={recipeListState} onListStateChange={setRecipeListState} />}
      {screen === 'mypage' && <MyPage onSaveSettings={handleSaveSettings} onSignOut={onSignOut} onNavigate={handleMainNavigate} onEditProfile={handleEditProfile} initialAlerts={alerts} account={account} nickname={nickname} initialPreferences={preferences} />}
      {screen === 'shopping' && <Cart items={cartItems} onItemsChange={setCartItems} onOpenPackageSolution={handleOpenPackageSolution} onStartRegistration={handleStartRegistration} registrationMessage={history.readState()?.registrationMessage} onNavigate={handleMainNavigate} onBack={() => { if (history.readState()?.fromApp) history.back(); else handleMainNavigate('/') }} />}
      <div hidden={isAIChatOpen || isNotificationOpen}><FloatingAssistant onClick={() => { setNotificationOpen(false); setAIChatOpen(true) }} /></div>
      {isAIChatOpen && <AIChat sheet onClose={closeAIChat} onNavigate={handleMainNavigate} messages={chatMessages} onMessagesChange={setChatMessages} />}
    </div>
  )
  if (screen === 'edit') return <EditProfilePage account={account} nickname={nickname} initialPreferences={preferences} onCancel={handleCancelEdit} onSave={handleSaveProfile} />

  return <Home fridgeItems={buildFridgeItems(inventory, registeredMaterials)} nickname={nickname} onNavigate={handleMainNavigate} />
  }
  return <NotificationContext.Provider value={{ open: openNotifications, isOpen: isNotificationOpen, unreadCount: notifications.filter((item) => !item.isRead).length }}>
    {inventoryLoading ? <div role="status" className="mx-auto max-w-app p-10 text-center">냉장고 정보를 불러오는 중…</div> : inventoryError && !inventoryReady ? <div role="alert" className="mx-auto max-w-app p-8"><p>{inventoryError}</p><button type="button" onClick={() => reloadInventory().catch(() => {})} className="mt-4 rounded-xl bg-[#006c49] px-5 py-3 text-white">다시 불러오기</button></div> : renderScreen()}
    {inventoryError && inventoryReady && <div role="alert" className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm rounded-xl border bg-white p-4 shadow-lg"><p>{inventoryError}</p><button type="button" onClick={() => reloadInventory().catch(() => {})}>다시 불러오기</button></div>}
    {isNotificationOpen && <NotificationDrawer notifications={notifications} onClose={closeNotifications} onRead={handleMarkRead} onMarkAllRead={handleMarkAllRead} onAction={handleNotificationAction} />}
  </NotificationContext.Provider>
}
