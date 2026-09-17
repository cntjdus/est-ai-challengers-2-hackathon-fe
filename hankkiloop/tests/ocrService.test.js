import { expect, it, vi } from 'vitest'
import { callGeminiOcr, handleOcrRequest, makeOcrResult } from '../server/ocrService'

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const goodModelBody = {
  candidates: [{
    finishReason: 'STOP',
    content: { parts: [{ text: JSON.stringify({ status: 'readable', raw_text: '소비기한 2026.09.18', dates: [{ raw_date: '2026.09.18', raw_label: '소비기한', kind: 'use_by', uncertain: false }], note: '소비기한 표시를 읽었습니다.' }) }] },
  }],
  usageMetadata: { totalTokenCount: 100 },
}

it('keeps complete use-by dates and requires confirmation', () => {
  const result = makeOcrResult({ status: 'readable', raw_text: '소비기한 2026.09.18', dates: [{ raw_date: '2026.09.18', raw_label: '소비기한', kind: 'use_by', uncertain: false }], note: '' })
  expect(result.candidates[0].iso_date).toBe('2026-09-18')
  expect(result.candidates[0].kind).toBe('use_by')
  expect(result.requires_confirmation).toBe(true)
})

it('never invents a missing year', () => {
  const result = makeOcrResult({ status: 'readable', raw_text: '소비기한 09.18', dates: [{ raw_date: '09.18', raw_label: '소비기한', kind: 'use_by', uncertain: false }], note: '' })
  expect(result.candidates[0].iso_date).toBe('')
  expect(result.candidates[0].warnings).toContain('missing_year')
})

it('retries one transient provider failure and then succeeds', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(response(503, { error: { message: 'temporary' } }))
    .mockResolvedValueOnce(response(200, goodModelBody))
  const sleeper = vi.fn().mockResolvedValue(undefined)
  const result = await callGeminiOcr({ mimeType: 'image/jpeg', data: 'aGVsbG8=' }, { GEMINI_API_KEY: 'test-key' }, fetcher, sleeper)
  expect(result.attempts).toBe(2)
  expect(fetcher).toHaveBeenCalledTimes(2)
  expect(sleeper).toHaveBeenCalledTimes(1)
})

it('does not retry a provider quota response', async () => {
  const fetcher = vi.fn().mockResolvedValue(response(429, { error: { message: 'quota' } }))
  const sleeper = vi.fn()
  await expect(callGeminiOcr({ mimeType: 'image/jpeg', data: 'aGVsbG8=' }, { GEMINI_API_KEY: 'test-key' }, fetcher, sleeper)).rejects.toMatchObject({ code: 'GEMINI_RATE_LIMIT' })
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(sleeper).not.toHaveBeenCalled()
})

it('authenticates before calling OCR and returns structured result', async () => {
  const fetcher = vi.fn(async (url) => {
    if (String(url).includes('/auth/v1/user')) return response(200, { id: 'user-ocr-1' })
    return response(200, goodModelBody)
  })
  const result = await handleOcrRequest({
    method: 'POST',
    headers: { authorization: 'Bearer user-token' },
    body: { image: { mimeType: 'image/jpeg', data: 'aGVsbG8=' } },
    env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', GEMINI_API_KEY: 'test-key' },
    fetchImpl: fetcher,
    ip: 'test-1',
    sleeper: async () => {},
  })
  expect(result.status).toBe(200)
  expect(result.body.candidates[0].iso_date).toBe('2026-09-18')
})
