// Copy into the React app only when integrating the reviewed OCR result.
// roi is normalized against the EXIF-oriented original image: each value 0..1.
export async function extractExpiry(file, roi, { baseUrl, signal } = {}) {
  if (!baseUrl) throw new Error('OCR API 주소를 설정해주세요.');
  const data = new FormData();
  data.append('file', file);
  for (const key of ['x', 'y', 'width', 'height']) {
    if (!Number.isFinite(roi?.[key])) throw new Error('날짜 영역을 선택해주세요.');
    data.append(key, String(roi[key]));
  }
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/ocr/expiry`, {
    method: 'POST', body: data, signal,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : (result.detail?.message || 'OCR 요청에 실패했어요.'));
  return result; // Even needs_confirmation is NOT a confirmed inventory date.
}
