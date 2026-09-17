try {
  const response = await fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(3000) })
  const data = await response.json()
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  console.log('OCR server: OK')
  console.log(`Gemini key configured: ${Boolean(data.api_key_configured)}`)
  console.log(`Model: ${data.model || 'unknown'}`)
  if (data.local_budget) console.log(`Today local attempts: ${data.local_budget.attempts}/${data.local_budget.local_daily_limit}`)
  if (!data.api_key_configured) process.exitCode = 1
} catch (error) {
  console.error('OCR server: FAIL')
  console.error('127.0.0.1:8000에서 OCR 서버가 실행 중인지 확인해주세요.')
  console.error(error.message)
  process.exitCode = 1
}
