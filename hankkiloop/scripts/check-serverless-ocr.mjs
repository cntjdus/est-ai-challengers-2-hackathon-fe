import fs from 'node:fs'
import path from 'node:path'
import { loadEnv } from 'vite'

const root = process.cwd()
const checks = []
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8') }
function check(name, ok, detail = '') { checks.push({ name, ok, detail }) }

const vite = read('vite.config.js')
const service = read('server/ocrService.js')
const client = read('src/data/expiryOcr.js')
const vercel = read('vercel.json')
const env = loadEnv('development', root, '')

check('OCR Vite middleware', vite.includes("/api/ocr/expiry") && vite.includes('handleOcrRequest'))
check('No local Python proxy', !vite.includes('127.0.0.1:8000') && !vite.includes("'/api/ocr'"))
check('Vercel OCR function', fs.existsSync(path.join(root, 'api/ocr/expiry.js')))
check('Shared OCR service', service.includes("gemini-3.8-flash") && service.includes('callGeminiOcr'))
check('One transient retry', service.includes('attempt <= 2') && service.includes('GEMINI_RETRY_EXHAUSTED'))
check('Client image compression', client.includes('MAX_OUTPUT_BYTES') && client.includes('canvas.toBlob'))
check('Vercel API excluded from SPA rewrite', vercel.includes('((?!api/)'))
check('Gemini key loaded', Boolean(env.GEMINI_API_KEY))
check('Supabase URL loaded', Boolean(env.VITE_SUPABASE_URL))
check('Supabase public key loaded', Boolean(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY))
check('No candidateCount in OCR request', !service.includes('candidateCount'))

for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` - ${item.detail}` : ''}`)
const failed = checks.filter((item) => !item.ok)
console.log(`\n${checks.length - failed.length} passed; ${failed.length} failed`)
if (failed.length) process.exitCode = 1
