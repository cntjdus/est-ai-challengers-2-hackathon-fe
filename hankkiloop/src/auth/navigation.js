const returnKey = 'hankkiloop.auth.returnTo'

export function safeReturnPath(path) {
  if (typeof path !== 'string' || !/^\/(?:home|mypage(?:\/edit)?|fridge(?:\/[A-Za-z0-9-]+)?|recipes?|recipe\/[A-Za-z0-9-]+|shopping|ai-chat)?$/.test(path)) return '/'
  return path
}

export function rememberReturnPath(path) {
  try { sessionStorage.setItem(returnKey, safeReturnPath(path)) } catch { /* Private browsing may disable storage. */ }
}

export function takeReturnPath() {
  try {
    const path = safeReturnPath(sessionStorage.getItem(returnKey))
    sessionStorage.removeItem(returnKey)
    return path
  } catch { return '/' }
}

export function navigateAuth(path) {
  history.replaceState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

// Every old back/forward entry must belong to the current account before its draft is restored.
export function createUserHistory(userId, browserHistory = window.history) {
  if (browserHistory.state?.ownerId !== userId) browserHistory.replaceState({ ownerId: userId }, '')
  return {
    readState() { return browserHistory.state?.ownerId === userId ? browserHistory.state : null },
    pushState(state, title, url) { browserHistory.pushState({ ...state, ownerId: userId }, title, url) },
    replaceState(state, title, url) { browserHistory.replaceState({ ...state, ownerId: userId }, title, url) },
    back() { browserHistory.back() },
  }
}
