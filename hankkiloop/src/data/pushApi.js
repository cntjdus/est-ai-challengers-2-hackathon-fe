const workerPath = '/hk-push-sw.js'
let bindingGeneration = 0
export const pushSupported = () => typeof window !== 'undefined' && window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
const keyBytes = key => Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
async function bindUser(registration, userId) {
  const worker = registration.active
  if (!worker) throw new Error('알림 준비 중이에요. 잠시 후 다시 시도해주세요.')
  await new Promise((resolve, reject) => {
    const channel = new MessageChannel()
    const timeout = setTimeout(() => { channel.port1.close(); reject(new Error('알림 설정 시간이 초과됐어요.')) }, 5000)
    channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); if (event.data?.ok) resolve(); else reject(new Error('알림 설정을 저장하지 못했어요.')) }
    worker.postMessage({ type: 'HK_BIND_USER', userId }, [channel.port2])
  })
}
export async function enablePush(client, userId, publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY) {
  const generation = ++bindingGeneration
  if (!pushSupported()) throw new Error('이 브라우저는 푸시 알림을 지원하지 않아요. iPhone은 홈 화면에 추가한 앱에서 시도해주세요.')
  if (!publicKey) throw new Error('푸시 발송 설정이 아직 준비되지 않았어요.')
  // Must be called directly from a user gesture.
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('브라우저 알림 권한을 허용해주세요.')
  await navigator.serviceWorker.register(workerPath)
  const registration = await navigator.serviceWorker.ready
  await bindUser(registration, null)
  const old = await registration.pushManager.getSubscription()
  if (old) {
    const removed = await client.from('hk_push_subscriptions').delete().eq('user_id', userId).eq('endpoint', old.endpoint)
    if (removed.error) throw removed.error
    await old.unsubscribe()
  }
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })
  const json = subscription.toJSON()
  try {
    const { error } = await client.from('hk_push_subscriptions').insert({ user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth })
    if (error) throw error
    if (generation === bindingGeneration) await bindUser(registration, userId)
    else { await subscription.unsubscribe(); throw new Error('계정이 변경됐어요. 다시 설정해주세요.') }
  } catch (error) { await subscription.unsubscribe(); throw error }
}
export async function disablePush(client, userId) {
  bindingGeneration++
  if (!pushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration('/')
  if (!registration?.active?.scriptURL.endsWith(workerPath)) return
  await bindUser(registration, null)
  const notifications = await registration.getNotifications()
  notifications.forEach(n => n.close())
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  // Stop delivery locally even if the database is temporarily unreachable.
  await subscription.unsubscribe()
  const { error } = await client.from('hk_push_subscriptions').delete().eq('user_id', userId).eq('endpoint', subscription.endpoint)
  if (error) throw error
}
export async function isPushEnabled(client, userId) {
  const generation = ++bindingGeneration
  if (!pushSupported() || Notification.permission !== 'granted') return false
  const registration = await navigator.serviceWorker.getRegistration('/')
  if (!registration?.active?.scriptURL.endsWith(workerPath)) return false
  await bindUser(registration, null)
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return false
  const { data, error } = await client.from('hk_push_subscriptions').select('id').eq('user_id', userId).eq('endpoint', subscription.endpoint).maybeSingle()
  if (error) throw error
  if (generation !== bindingGeneration) return false
  await bindUser(registration, data ? userId : null)
  return !!data
}
