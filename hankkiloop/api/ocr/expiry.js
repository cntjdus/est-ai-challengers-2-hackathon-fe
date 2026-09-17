import { handleOcrRequest } from '../../server/ocrService.js'

function parseBody(body) {
  if (body == null) return {}
  if (typeof body === 'object') return body
  if (typeof body !== 'string') return {}
  try { return JSON.parse(body) }
  catch { return {} }
}

export default async function handler(request, response) {
  const forwarded = request.headers['x-forwarded-for']
  const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0].trim()
  const result = await handleOcrRequest({
    method: request.method,
    headers: request.headers,
    body: parseBody(request.body),
    env: process.env,
    ip,
  })

  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value)
  if (result.status === 204) return response.status(204).end()
  return response.status(result.status).json(result.body)
}
