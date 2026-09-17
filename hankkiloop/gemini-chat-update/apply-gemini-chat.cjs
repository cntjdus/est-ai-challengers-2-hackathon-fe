const fs = require('node:fs')
const path = require('node:path')

const files = [
  '.env.example',
  'vite.config.js',
  'api/chat.js',
  'server/chatService.js',
  'src/data/chatApi.js',
  'src/data/chatMessages.js',
  'src/pages/AIChat.jsx',
  'scripts/test-gemini-chat.mjs',
  'docs/GEMINI_CHAT_SETUP.md',
]

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const targetArg = args.find((value) => !value.startsWith('--')) || process.cwd()
const sourceRoot = path.join(__dirname, 'files', 'hankkiloop')

function readPackage(directory) {
  const filename = path.join(directory, 'package.json')
  if (!fs.existsSync(filename)) return null
  try { return JSON.parse(fs.readFileSync(filename, 'utf8')) }
  catch { return null }
}

function resolveProject(input) {
  const direct = path.resolve(input)
  if (readPackage(direct)?.name === 'hankkiloop') return direct
  const nested = path.join(direct, 'hankkiloop')
  if (readPackage(nested)?.name === 'hankkiloop') return nested
  throw new Error(`hankkiloop 프로젝트를 찾지 못했습니다: ${direct}`)
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
}

try {
  const targetRoot = resolveProject(targetArg)
  for (const relative of files) {
    if (!fs.existsSync(path.join(sourceRoot, relative))) throw new Error(`업데이트 파일이 없습니다: ${relative}`)
  }

  console.log(`대상 프로젝트: ${targetRoot}`)
  console.log(`적용 파일: ${files.length}개`)
  if (checkOnly) {
    console.log('CHECK PASS: 프로젝트와 업데이트 파일을 확인했습니다. 아직 변경하지 않았습니다.')
    process.exit(0)
  }

  const backupRoot = path.join(targetRoot, `.gemini-chat-backup-${stamp()}`)
  let backedUp = 0
  for (const relative of files) {
    const source = path.join(sourceRoot, relative)
    const destination = path.join(targetRoot, relative)
    if (fs.existsSync(destination)) {
      const backup = path.join(backupRoot, relative)
      fs.mkdirSync(path.dirname(backup), { recursive: true })
      fs.copyFileSync(destination, backup)
      backedUp += 1
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(source, destination)
    console.log(`APPLY ${relative}`)
  }

  if (backedUp) console.log(`기존 파일 백업: ${backupRoot}`)
  console.log('\n적용 완료. .env.local의 키 값은 변경하지 않았습니다.')
  console.log('다음 명령을 실행하세요:')
  console.log('  node .\\scripts\\test-gemini-chat.mjs')
  console.log('  npm test')
  console.log('  npm run build')
  console.log('  npm run dev')
} catch (error) {
  console.error(`ERROR: ${error.message}`)
  process.exit(1)
}
