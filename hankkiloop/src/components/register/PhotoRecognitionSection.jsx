import { useEffect, useRef, useState } from 'react'
import { Camera, Images, RotateCcw, ScanLine, Square, XCircle } from 'lucide-react'
import { dateKinds, dateWarnings, extractExpiry, isCalendarDate } from '../../data/expiryOcr'

const full = { x: 0, y: 0, width: 1, height: 1 }
const button = 'rounded-xl border border-[#cbded2] bg-white px-3 py-2 text-xs text-[#006c49] disabled:opacity-40'
const riskyWarnings = new Set(['missing_year', 'two_digit_year', 'uncertain_reading', 'label_mismatch', 'relative_date_expression'])
const qualityLabels = { too_dark: '사진이 어두움', low_contrast: '글자 대비가 낮음', blurred: '초점이 흐림' }

function canPreselect(candidate) {
  return candidate?.kind === 'use_by' && isCalendarDate(candidate?.iso_date) && !(candidate?.warnings ?? []).some((warning) => riskyWarnings.has(warning))
}
function dateWithCurrentYear(candidate) {
  if (candidate?.iso_date) return candidate.iso_date

  const warnings = candidate?.warnings ?? []

  if (
    warnings.includes('missing_year') &&
    Number.isInteger(candidate?.month) &&
    Number.isInteger(candidate?.day)
  ) {
    const year = new Date().getFullYear()
    const month = String(candidate.month).padStart(2, '0')
    const day = String(candidate.day).padStart(2, '0')
    const inferred = `${year}-${month}-${day}`

    return isCalendarDate(inferred) ? inferred : ''
  }

  return ''
}
export default function PhotoRecognitionSection({ photo, onPhotoChange, onConfirm, materialName }) {
  const cameraRef = useRef(null)
  const albumRef = useRef(null)
  const drag = useRef(null)
  const active = useRef(null)
  const generation = useRef(0)
  const [roi, setRoi] = useState(full)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('날짜 숫자와 “소비기한” 같은 표시 문구를 함께 촬영해주세요.')
  const [selected, setSelected] = useState(null)
  const [date, setDate] = useState('')
  const [kind, setKind] = useState('')
  const [checked, setChecked] = useState(false)

  useEffect(() => () => {
    generation.current += 1
    active.current?.abort()
    if (photo?.url) URL.revokeObjectURL(photo.url)
  }, [photo?.url])

  function clearReading() {
    setResult(null)
    setSelected(null)
    setDate('')
    setKind('')
    setChecked(false)
  }
  

  function choosePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('JPG, PNG, WebP 사진을 선택해주세요. HEIC는 JPG로 변환해주세요.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setMessage('15MB 이하 사진을 선택해주세요.')
      return
    }
    generation.current += 1
    active.current?.abort()
    active.current = null
    setBusy(false)
    clearReading()
    setRoi(full)
    setMessage('사진 전체를 바로 읽거나 날짜 주변만 드래그해서 읽을 수 있어요.')
    onPhotoChange({ url: URL.createObjectURL(file), name: file.name, file, loaded: false })
  }

  function point(event) {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    }
  }

  function move(event) {
    if (!drag.current || busy) return
    const p = point(event)
    const a = drag.current
    if (Math.abs(p.x - a.x) < 0.01 || Math.abs(p.y - a.y) < 0.01) return
    setRoi({ x: Math.min(p.x, a.x), y: Math.min(p.y, a.y), width: Math.abs(p.x - a.x), height: Math.abs(p.y - a.y) })
    clearReading()
  }

  function select(candidate) {
    setSelected(candidate)
    //setDate(candidate.iso_date || '')
    setDate(dateWithCurrentYear(candidate))
    setKind(candidate.kind)
    setChecked(false)
  }

  async function analyze(region = roi) {
    if (!photo?.loaded || busy || active.current) return
    clearReading()
    setBusy(true)
    setMessage('Gemini 3.8 Flash가 날짜를 읽고 있어요. 일시적인 서버 오류면 한 번 자동 재시도합니다.')
    const controller = new AbortController()
    const id = ++generation.current
    active.current = controller
    const timeout = setTimeout(() => controller.abort(), 60000)
    try {
      const value = await extractExpiry(photo.file, region, { signal: controller.signal })
      if (generation.current !== id) return
      setResult(value)
      setMessage(value.retried ? value.message + ' 일시적인 오류 후 자동 재시도에 성공했어요.' : value.message)
      const safe = (value.candidates ?? []).filter(canPreselect)
      if (safe.length === 1) select(safe[0])
    } catch (error) {
      if (generation.current === id) {
        setMessage(error.name === 'AbortError'
          ? '인식을 중단했어요. 서버에서 이미 시작한 요청은 끝까지 처리될 수 있어요.'
          : error.message)
      }
    } finally {
      clearTimeout(timeout)
      if (generation.current === id) {
        active.current = null
        setBusy(false)
      }
    }
  }

  function cancel() {
    if (!busy) return
    generation.current += 1
    active.current?.abort()
    active.current = null
    setBusy(false)
    setMessage('인식을 중단했어요. 다른 영역을 선택하거나 다시 시도할 수 있어요.')
  }

  function apply() {
    if (!selected || !checked || kind !== 'use_by' || !isCalendarDate(date)) return
    onConfirm({ date, kind, candidateId: selected.id })
    setChecked(false)
    setMessage('확인한 소비기한을 아래 재료 정보에 반영했어요. 마지막 등록 버튼을 눌러 저장해주세요.')
  }

  return <section aria-label="사진 인식" className="rounded-3xl border border-[#d9e6dd] bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">{materialName || '선택한 재료'}의 소비기한 읽기</h2>
        <p className="mt-1 text-xs leading-5 text-[#64748b]">사진의 선택 영역만 Gemini로 전송합니다. AI가 읽은 값은 자동 저장되지 않고 직접 확인 후 반영됩니다. 별도 OCR 프로그램을 실행할 필요는 없어요.</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#ecfdf5] px-2 py-1 text-[10px] text-[#008768]">Gemini 3.8 Flash</span>
    </div>

    <div className="my-3 flex flex-wrap gap-2">
      <button type="button" className={button} disabled={busy} onClick={() => cameraRef.current.click()}><Camera className="mr-1 inline size-3" />{photo ? '다시 촬영' : '촬영하기'}</button>
      <button type="button" className={button} disabled={busy} onClick={() => albumRef.current.click()}><Images className="mr-1 inline size-3" />사진 선택</button>
    </div>

    {photo && <>
      <div className="flex justify-center rounded-xl bg-slate-100">
        <div className="relative inline-block max-w-full overflow-hidden rounded-xl" style={{ touchAction: 'none', lineHeight: 0 }}
          onPointerDown={(event) => {
            if (!busy && photo.loaded) {
              drag.current = point(event)
              event.currentTarget.setPointerCapture(event.pointerId)
            }
          }}
          onPointerMove={move}
          onPointerUp={() => { drag.current = null }}
          onPointerCancel={() => { drag.current = null }}>
          <img key={photo.url} src={photo.url} alt="선택한 제품의 날짜 사진" draggable={false} className="block max-h-[420px] max-w-full select-none object-contain"
            onLoad={() => { if (!photo.loaded) onPhotoChange({ ...photo, loaded: true }) }}
            onError={() => { setMessage('사진을 열지 못했어요. 다른 사진을 선택해주세요.'); onPhotoChange(null); clearReading() }} />
          <div aria-hidden="true" className="pointer-events-none absolute border-2 border-[#10b981]" style={{ left: `${roi.x * 100}%`, top: `${roi.y * 100}%`, width: `${roi.width * 100}%`, height: `${roi.height * 100}%`, boxShadow: '0 0 0 9999px #001b1844' }} />
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-[#64748b]">날짜와 “소비기한” 문구가 같이 들어오도록 드래그하면 오인식을 줄일 수 있어요.</p>
      <div className="my-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} className={button} onClick={() => { setRoi(full); clearReading(); setMessage('사진 전체를 선택했어요.') }}><RotateCcw className="mr-1 inline size-3" />전체 영역</button>
        <button type="button" disabled={busy || !photo.loaded} className={button} onClick={() => { setRoi(full); analyze(full) }}><Square className="mr-1 inline size-3" />사진 전체 읽기</button>
        <button type="button" disabled={busy || !photo.loaded} onClick={() => analyze(roi)} className="rounded-xl bg-[#006c49] px-4 py-2 text-xs text-white disabled:opacity-40"><ScanLine className="mr-1 inline size-3" />{busy ? '날짜 읽는 중…' : '선택 영역 날짜 읽기'}</button>
        {busy && <button type="button" onClick={cancel} className={button}><XCircle className="mr-1 inline size-3" />중단</button>}
      </div>
    </>}

    <p role="status" className="rounded-xl bg-[#eff8f2] p-3 text-xs leading-5 text-[#345746]">{message}</p>

    {result && <div className="mt-4 space-y-3">
      <div className="rounded-xl bg-[#fafcf9] p-3">
        <h3 className="text-xs font-semibold">읽은 원문</h3>
        <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#64748b]">{result.raw_text || '읽은 문자가 없어요. 아래에서 직접 입력하거나 다시 촬영해주세요.'}</p>
        {result.provider_attempts > 1 && <p className="mt-2 text-[10px] text-[#64748b]">Gemini 일시 오류로 자동 재시도 1회 후 성공</p>}
        {result.quality?.reasons?.length > 0 && <p className="mt-2 text-[10px] text-[#8a5a18]">사진 품질 참고: {result.quality.reasons.map((reason) => qualityLabels[reason] || reason).join(' / ')}</p>}
      </div>

      {(result.candidates ?? []).length > 0 && <div>
        <h3 className="mb-2 text-xs font-semibold">날짜 후보</h3>
        <div className="space-y-2">{result.candidates.map((candidate) => <button type="button" key={candidate.id} className={button + ' block w-full text-left aria-pressed:border-[#10b981] aria-pressed:bg-[#e2f5e9]'} aria-pressed={selected?.id === candidate.id} onClick={() => select(candidate)}>
          <strong>{candidate.iso_date || candidate.raw} · {dateKinds[candidate.kind] || '종류 확인 필요'}</strong>
          <span className="mt-1 block text-[11px] leading-4">{candidate.source_text}</span>
          {candidate.warnings?.length > 0 && <span className="mt-1 block text-[11px] leading-4 text-[#8a5a18]">{candidate.warnings.map((warning) => dateWarnings[warning] || warning).join(' / ')}</span>}
        </button>)}</div>
      </div>}

      {selected && <div className="space-y-3 rounded-xl border border-[#cbded2] p-3">
        {canPreselect(selected) && <p className="rounded-lg bg-[#ecfdf5] px-2 py-1.5 text-[11px] text-[#006c49]">소비기한 형식이 명확해 보여도 자동 반영하지 않아요. 사진과 비교한 뒤 아래 확인 체크를 해주세요.</p>}
        <label className="block text-xs">확인한 날짜<input type="date" aria-label="OCR 확인 날짜" value={date} onChange={(event) => { setDate(event.target.value); setChecked(false) }} className="mt-1 block w-full rounded-lg border p-2" /></label>
        {!selected.iso_date && <p className="text-xs text-[#8a5a18]">사진에 연도가 없어 현재 연도인 {new Date().getFullYear()}년으로 임시 입력했어요. 실제 포장 날짜와 맞는지 확인해주세요.</p>}
        <label className="block text-xs">포장에 표시된 종류<select aria-label="OCR 날짜 종류" value={kind} onChange={(event) => { setKind(event.target.value); setChecked(false) }} className="mt-1 block w-full rounded-lg border bg-white p-2">{Object.entries(dateKinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {kind !== 'use_by' && <p className="text-xs leading-5 text-[#8a5a18]">현재 냉장고 입력란은 소비기한이에요. 제조일·유통기한·품질유지기한을 소비기한으로 임의 변환하지 않습니다.</p>}
        <label className="flex items-start gap-2 text-xs leading-5"><input type="checkbox" className="mt-1" checked={checked} onChange={(event) => setChecked(event.target.checked)} />사진의 날짜와 “소비기한” 표시를 직접 확인했어요.</label>
        <button type="button" className={button} disabled={!checked || kind !== 'use_by' || !isCalendarDate(date)} onClick={apply}>확인한 소비기한 반영</button>
      </div>}
    </div>}

    <input ref={cameraRef} aria-label="카메라 사진 선택" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={choosePhoto} className="hidden" />
    <input ref={albumRef} aria-label="앨범 사진 선택" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} className="hidden" />
  </section>
}
