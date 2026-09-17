import { useEffect, useRef, useState } from 'react'
import App from '../App'
import { disablePush } from '../data/pushApi'
import LoginPage from '../pages/LoginPage'
import OnboardingPage from '../pages/OnboardingPage'
import PreferenceSetupPage from '../pages/PreferenceSetupPage'
import { supabase } from '../lib/supabase'
import { loadAccount, saveAccount } from './profile'
import { signOutAccount } from './signOut'
import { authErrorMessage, readCallbackError } from './errors'
import { navigateAuth, rememberReturnPath, takeReturnPath } from './navigation'

const callbackError = readCallbackError()

function AccountStatus({ error, onRetry, onSignOut }) {
  return <main className="mx-auto flex min-h-dvh max-w-app flex-col items-center justify-center gap-5 bg-[#f8f9ff] px-6 text-center text-[#1b4535]">
    <p role={error ? 'alert' : 'status'} className="text-sm leading-6">{error || '계정을 확인하고 있어요…'}</p>
    {error && <div className="flex gap-3"><button onClick={onRetry} className="rounded-xl bg-[#006c49] px-5 py-3 text-sm text-white">다시 시도</button><button onClick={onSignOut} className="rounded-xl border border-[#bbcabf] px-5 py-3 text-sm">로그아웃</button></div>}
  </main>
}

function OnboardingFlow({ profile, onSave, onSignOut }) {
  const [step, setStep] = useState('profile')
  const [draft, setDraft] = useState(profile)
  const [accepted, setAccepted] = useState(false)
  const [notificationConsent, setNotificationConsent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  useEffect(() => {
    navigateAuth(step === 'profile' ? '/onboarding' : '/onboarding/preferences')
    const onBack = () => {
      if (location.pathname !== '/onboarding/preferences') setStep('profile')
    }
    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [step])
  const finish = async (value) => {
    if (saving.current || !accepted) return
    saving.current = true
    setBusy(true)
    setError('')
    try {
      await onSave({ ...value, alerts: { expirationAlert: notificationConsent, recipeSuggestionAlert: notificationConsent } }, true)
    } catch (failure) { setError(authErrorMessage(failure)) }
    finally { saving.current = false; setBusy(false) }
  }
  if (step === 'preferences') return <PreferenceSetupPage account={draft.account} nickname={draft.nickname} initialPreferences={draft.preferences} onComplete={finish} busy={busy} error={error} onBack={() => setStep('profile')} />
  return <OnboardingPage account={draft.account} initialNickname={draft.nickname} initialAgreeAll={accepted} initialNotificationConsent={notificationConsent} onBack={onSignOut} onChangeAccount={onSignOut} onContinue={(value) => {
    setDraft({ ...draft, nickname: value.nickname })
    setAccepted(value.agreeAll)
    setNotificationConsent(value.notificationConsent)
    setStep('preferences')
  }} />
}

export default function AuthGate() {
  const [session, setSession] = useState(supabase ? undefined : null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(callbackError)
  const [profileError, setProfileError] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [path, setPath] = useState(location.pathname)
  const liveUserId = useRef(null)
  const signingIn = useRef(false)

  useEffect(() => {
    const onPop = () => setPath(location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!supabase) return
    let active = true
    let eventSeen = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      eventSeen = true
      if (liveUserId.current !== (nextSession?.user.id || null)) { setProfile(null); setProfileError('') }
      liveUserId.current = nextSession?.user.id || null
      setSession(nextSession)
    })
    supabase.auth.getSession().then(({ data, error: failure }) => {
      if (!active) return
      if (failure) setError(authErrorMessage(failure))
      if (!eventSeen) {
        liveUserId.current = data.session?.user.id || null
        setSession(data.session)
      }
    }).catch((failure) => { if (active) { setError(authErrorMessage(failure)); setSession(null) } })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId || !supabase) return
    let active = true
    const readProfile = async () => {
      try {
        const { data, error: failure } = await supabase.auth.getUser()
        if (failure) throw failure
        if (!data.user || data.user.id !== userId) throw new Error('Session changed')
        const result = await loadAccount(supabase, data.user)
        if (active) setProfile(result)
      } catch (failure) { if (active) setProfileError(authErrorMessage(failure)) }
    }
    readProfile()
    return () => { active = false }
  }, [userId, attempt])

  useEffect(() => {
    if (session === undefined) return
    if (!session) {
      if (!['/login', '/auth/callback', '/onboarding', '/onboarding/preferences'].includes(path)) rememberReturnPath(path)
      if (path !== '/login') navigateAuth('/login')
    } else if (profile?.account.id === userId && profile.onboardingCompleted && ['/login', '/auth/callback', '/onboarding', '/onboarding/preferences'].includes(path)) {
      navigateAuth(takeReturnPath())
    }
  }, [session, profile, path, userId])

  const signIn = async () => {
    if (!supabase || signingIn.current) return
    signingIn.current = true
    setBusy(true)
    setError('')
    try {
      const { error: failure } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } },
      })
      if (failure) throw failure
    } catch (failure) { setError(authErrorMessage(failure)) }
    finally { signingIn.current = false; setBusy(false) }
  }

  const signOut = async () => {
    if (!supabase) return
    await signOutAccount(supabase, session?.user.id, disablePush)
    liveUserId.current = null
    setProfile(null)
    setSession(null)
    setError('')
    takeReturnPath()
    navigateAuth('/login')
  }

  const saveProfile = async (draft, completeOnboarding = false) => {
    const user = session?.user
    if (!user || liveUserId.current !== user.id) throw new Error('Session changed')
    const result = await saveAccount(supabase, user, draft, completeOnboarding)
    if (liveUserId.current !== user.id) throw new Error('Session changed')
    setProfile(result)
    if (completeOnboarding) navigateAuth(takeReturnPath())
    return result
  }

  const handleStatusSignOut = () => signOut().catch((failure) => setProfileError(authErrorMessage(failure)))
  if (session === undefined) return <AccountStatus />
  if (!session) return <LoginPage onGoogleLogin={signIn} busy={busy} error={error} configured={Boolean(supabase)} />
  if (profileError || !profile || profile.account.id !== userId) return <AccountStatus error={profileError} onRetry={() => { setProfile(null); setProfileError(''); setAttempt((value) => value + 1) }} onSignOut={handleStatusSignOut} />
  if (!profile.onboardingCompleted) return <OnboardingFlow key={userId} profile={profile} onSave={saveProfile} onSignOut={handleStatusSignOut} />
  if (['/login', '/auth/callback', '/onboarding', '/onboarding/preferences'].includes(path)) return <AccountStatus />
  return <App key={userId} initialProfile={profile} onSaveProfile={saveProfile} onSignOut={signOut} />
}
