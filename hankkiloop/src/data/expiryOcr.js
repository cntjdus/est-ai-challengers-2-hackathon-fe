import { supabase } from '../lib/supabase'

export const dateKinds = { use_by: '소비기한', sell_by: '유통기한', manufactured: '제조일', best_before: '품질유지기한', expiry_unspecified: 'EXP · 종류 확인 필요', unknown: '종류 확인 필요' }
export const dateWarnings = { missing_year: '연도 없음 · 직접 확인', two_digit_year: '두 자리 연도 · 직접 확인', confirm_date_kind: '날짜 종류 확인 필요', relative_date_expression: '기간 계산 문구 · 직접 확인', uncertain_reading: '글자 판독 불확실', label_mismatch: '날짜와 문구 연결 확인 필요' }

const MAX_SOURCE_BYTES = 15 * 1024 * 1024
const MAX_OUTPUT_BYTES = 1_400_000
const MAX_EDGE = 1800
const MIN_CROP_WIDTH = 80
const MIN_CROP_HEIGHT = 28

export function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T12:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validateRoi(roi) {
  const values = ['x', 'y', 'width', 'height'].map((key) => Number(roi?.[key]))
  const [x, y, width, height] = values
  if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1.00001 || y + height > 1.00001) {
    throw new Error('사진 안에서 날짜 영역을 다시 선택해주세요.')
  }
  return { x, y, width, height }
}

function blobFromCanvas(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('사진을 변환하지 못했어요.')), 'image/jpeg', quality))
}

function loadBrowserImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ image, release: () => URL.revokeObjectURL(url) })
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('사진을 열 수 없어요. JPG, PNG, WebP 사진을 다시 선택해주세요.')) }
    image.src = url
  })
}

async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

export async function prepareOcrImage(file, roi) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG, PNG, WebP 사진을 선택해주세요.')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('15MB 이하 사진을 선택해주세요.')
  const region = validateRoi(roi)
  const { image, release } = await loadBrowserImage(file)
  try {
    const sourceWidth = image.naturalWidth || image.width
    const sourceHeight = image.naturalHeight || image.height
    const sx = Math.max(0, Math.floor(region.x * sourceWidth))
    const sy = Math.max(0, Math.floor(region.y * sourceHeight))
    const sw = Math.min(sourceWidth - sx, Math.max(1, Math.floor(region.width * sourceWidth)))
    const sh = Math.min(sourceHeight - sy, Math.max(1, Math.floor(region.height * sourceHeight)))
    if (sw < MIN_CROP_WIDTH || sh < MIN_CROP_HEIGHT) throw new Error('날짜 영역이 너무 작아요. 날짜와 문구가 함께 들어오도록 조금 넓게 선택해주세요.')

    let scale = Math.min(1, MAX_EDGE / Math.max(sw, sh))
    let quality = 0.88
    let blob
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const width = Math.max(1, Math.round(sw * scale))
      const height = Math.max(1, Math.round(sh * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { alpha: false })
      if (!context) throw new Error('브라우저에서 사진을 처리하지 못했어요.')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height)
      blob = await blobFromCanvas(canvas, quality)
      if (blob.size <= MAX_OUTPUT_BYTES) break
      if (quality > 0.68) quality -= 0.1
      else scale *= 0.8
    }
    if (!blob || blob.size > MAX_OUTPUT_BYTES) throw new Error('사진 용량을 줄이지 못했어요. 날짜 영역만 조금 더 좁게 선택해주세요.')
    return {
      mimeType: 'image/jpeg',
      data: await blobToBase64(blob),
      byteLength: blob.size,
      width: Math.round(sw * scale),
      height: Math.round(sh * scale),
    }
  } finally {
    release()
  }
}

export async function extractExpiry(file, roi, { signal, client = supabase, fetcher = fetch, prepareImage = prepareOcrImage } = {}) {
  if (!client) throw new Error('Supabase 설정을 확인하고 로그인해주세요.')
  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new Error('로그인 후 다시 시도해주세요.')
  const image = await prepareImage(file, roi)

  let response
  try {
    response = await fetcher('/api/ocr/expiry', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: { mimeType: image.mimeType, data: image.data } }),
      signal,
    })
  } catch (failure) {
    if (failure.name === 'AbortError') throw failure
    throw new Error('사진 인식 API에 연결하지 못했어요. 인터넷 연결을 확인해주세요.')
  }

  let result
  try { result = await response.json() }
  catch { throw new Error('사진 인식 응답을 읽지 못했어요. 잠시 후 다시 시도해주세요.') }

  if (!response.ok) {
    const message = typeof result?.error === 'string' ? result.error : '날짜 인식 요청에 실패했어요.'
    const failure = new Error(message)
    failure.code = result?.code || ''
    failure.status = response.status
    throw failure
  }
  if (!Array.isArray(result.candidates)) throw new Error('인식 결과를 읽지 못했어요. 직접 입력하거나 다시 시도해주세요.')
  return result
}
