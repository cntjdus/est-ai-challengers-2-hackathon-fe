export function authErrorMessage(error) {
  const code = error?.code || ''
  const message = error?.message || ''
  if (code === 'access_denied' || /access_denied/i.test(message)) return 'Google 로그인이 취소되었습니다. 다시 시도해주세요.'
  if (['PGRST204', '42703'].includes(code)) return '계정 설정을 저장할 준비가 아직 완료되지 않았어요. 관리자에게 문의해주세요.'
  if (code === '42501' || /row-level security/i.test(message)) return '계정 정보를 저장할 권한을 확인하지 못했어요. 관리자에게 문의해주세요.'
  if (/fetch|network|timeout/i.test(message)) return '연결이 원활하지 않아요. 인터넷 연결을 확인하고 다시 시도해주세요.'
  if (/provider|not enabled/i.test(message)) return 'Google 로그인 연결을 준비 중이에요. 잠시 후 다시 시도해주세요.'
  if (/닉네임|요리 횟수|식단 태그/.test(message)) return message
  return '로그인 또는 계정 정보 처리에 실패했어요. 다시 시도해주세요.'
}

export function readCallbackError(url = window.location.href) {
  const parsed = new URL(url)
  const hash = new URLSearchParams(parsed.hash.slice(1))
  const code = parsed.searchParams.get('error_code') || parsed.searchParams.get('error') || hash.get('error_code') || hash.get('error')
  return code ? authErrorMessage({ code }) : ''
}
