import { expect, it, vi } from 'vitest'
import { extractExpiry, isCalendarDate } from '../src/data/expiryOcr'

const file = new File(['image'], 'date.jpg', { type: 'image/jpeg' })
const roi = { x: 0, y: 0, width: 1, height: 1 }
const client = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'session-token' } } }) } }
const prepareImage = vi.fn().mockResolvedValue({ mimeType: 'image/jpeg', data: 'aGVsbG8=', byteLength: 5 })

it('sends compressed image JSON to the same-origin OCR route', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) })
  await extractExpiry(file, roi, { client, fetcher, prepareImage })
  const [url, request] = fetcher.mock.calls[0]
  expect(url).toBe('/api/ocr/expiry')
  expect(request.headers.Authorization).toBe('Bearer session-token')
  expect(request.headers['Content-Type']).toBe('application/json')
  expect(JSON.parse(request.body)).toEqual({ image: { mimeType: 'image/jpeg', data: 'aGVsbG8=' } })
})

it('refuses missing sessions before preparing or sending a photo', async () => {
  const fetcher = vi.fn()
  const prepare = vi.fn()
  await expect(extractExpiry(file, roi, { client: { auth: { getSession: async () => ({ data: { session: null } }) } }, fetcher, prepareImage: prepare })).rejects.toThrow('로그인')
  expect(fetcher).not.toHaveBeenCalled()
  expect(prepare).not.toHaveBeenCalled()
})

it('surfaces server error messages', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: '자동 재시도 후에도 실패했어요.', code: 'GEMINI_RETRY_EXHAUSTED' }) })
  await expect(extractExpiry(file, roi, { client, fetcher, prepareImage })).rejects.toThrow('자동 재시도')
})

it('requires complete valid calendar dates', () => {
  expect(isCalendarDate('2026-02-30')).toBe(false)
  expect(isCalendarDate('03.13')).toBe(false)
  expect(isCalendarDate('2028-02-29')).toBe(true)
})
