import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { handleChatRequest } from './server/chatService.js'
import { handleOcrRequest } from './server/ocrService.js'

async function readJsonBody(request, maxBytes) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maxBytes) throw new Error('PAYLOAD_TOO_LARGE')
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function sendResult(response, result) {
  response.statusCode = result.status
  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value)
  response.end(result.status === 204 ? undefined : JSON.stringify(result.body))
}

function geminiDevApi(env) {
  return {
    name: 'hankkiloop-gemini-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (request, response) => {
        let body = {}
        try {
          body = await readJsonBody(request, 65_536)
        } catch (error) {
          response.statusCode = error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400
          response.setHeader('content-type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: error.message === 'PAYLOAD_TOO_LARGE' ? '요청이 너무 큽니다.' : '요청 형식을 확인해 주세요.', code: 'INVALID_JSON' }))
          return
        }
        const result = await handleChatRequest({
          method: request.method,
          headers: request.headers,
          body,
          env,
          ip: request.socket.remoteAddress || '',
        })
        sendResult(response, result)
      })

      server.middlewares.use('/api/ocr/expiry', async (request, response) => {
        let body = {}
        try {
          body = await readJsonBody(request, 3_200_000)
        } catch (error) {
          response.statusCode = error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400
          response.setHeader('content-type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: error.message === 'PAYLOAD_TOO_LARGE' ? '사진 데이터가 너무 큽니다. 날짜 영역을 조금 더 좁게 선택해주세요.' : '사진 요청 형식을 확인해 주세요.', code: 'INVALID_OCR_BODY' }))
          return
        }
        const result = await handleOcrRequest({
          method: request.method,
          headers: request.headers,
          body,
          env,
          ip: request.socket.remoteAddress || '',
        })
        sendResult(response, result)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), geminiDevApi(env)],
  }
})
