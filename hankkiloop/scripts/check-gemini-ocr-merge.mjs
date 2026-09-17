import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const checks = []
const add = (name, ok, detail = '') => checks.push({ name, ok, detail })
const text = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))

const vite = text('vite.config.js')
const chatService = text('server/chatService.js')
const env = loadEnv('development', root, '')

add('Gemini chat dev middleware', vite.includes('geminiChatDevApi'))
add('OCR dev proxy', vite.includes("'/api/ocr'") && vite.includes('127.0.0.1:8000'))
add('OCR frontend API', exists('src/data/expiryOcr.js'))
add('OCR photo UI', exists('src/components/register/PhotoRecognitionSection.jsx'))
add('OCR Python server', exists('ocr_server/app.py') && exists('ocr_server/ocr/engine.py'))
add('Gemini API key loaded', Boolean(env.GEMINI_API_KEY), '키 값은 출력하지 않음')
add('Supabase URL loaded', Boolean(env.VITE_SUPABASE_URL))
add('Supabase public key loaded', Boolean(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY))
add('Gemini model', (env.GEMINI_MODEL || 'gemini-3.8-flash') === 'gemini-3.8-flash', env.GEMINI_MODEL || 'gemini-3.8-flash (default)')
add('Prompt-injection guard present', chatService.includes('INJECTION_PATTERNS'))
add('No unsupported candidateCount', !/candidateCount\s*:\s*1/.test(chatService))

for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` - ${item.detail}` : ''}`)
}
const failed = checks.filter((item) => !item.ok)
console.log(`\n${checks.length - failed.length} passed; ${failed.length} failed`)
if (failed.length) process.exitCode = 1
