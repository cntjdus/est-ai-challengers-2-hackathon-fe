import { supabase } from '../lib/supabase'

const MAX_MESSAGES = 16

function requestMessages(messages) {
  return (messages ?? [])
    .filter((message) => ['user', 'assistant', 'model'].includes(message?.role) && typeof message?.content === 'string' && message.content.trim())
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content.trim(),
    }))
}

function fallbackError(status) {
  if (status === 401) return '로그인이 만료되었어요. 다시 로그인해 주세요.'
  if (status === 429) return '질문이 잠시 많아요. 조금 뒤에 다시 시도해 주세요.'
  if (status >= 500) return 'AI 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.'
  return '질문을 보내지 못했어요. 입력 내용을 확인해 주세요.'
}

export async function sendChatMessage(messages, { signal } = {}) {
  if (!supabase) throw new Error('로그인 연결 설정을 확인해 주세요.')
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error('로그인이 필요해요. 다시 로그인해 주세요.')

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages: requestMessages(messages) }),
    signal,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || fallbackError(response.status))
  if (typeof payload.answer !== 'string' || !payload.answer.trim()) throw new Error('AI 답변을 받지 못했어요. 다시 시도해 주세요.')
  return payload
}
