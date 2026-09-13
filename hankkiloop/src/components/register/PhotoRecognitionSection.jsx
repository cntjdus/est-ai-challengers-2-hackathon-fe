import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, Images, ReceiptText, RotateCcw } from 'lucide-react'
export default function PhotoRecognitionSection({ photo, onPhotoChange, recognizedCount }) {
  const cameraRef = useRef(null)
  const albumRef = useRef(null)
  const [error, setError] = useState('')
  useEffect(() => () => { if (photo?.url) URL.revokeObjectURL(photo.url) }, [photo?.url])
  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('이미지 파일을 선택해주세요.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('10MB 이하의 사진을 선택해주세요.'); return }
    setError('')
    onPhotoChange({ url: URL.createObjectURL(file), name: file.name, file, loaded: false })
  }
  return <section aria-label="사진 인식" className="overflow-hidden rounded-3xl bg-[#747b86] shadow-md">
    <div className="relative flex min-h-48 flex-col items-center justify-center gap-3 px-6 pt-6 pb-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-4 border-x-2 border-[#10b981]" />
      {photo ? <img src={photo.url} alt="선택한 영수증 또는 소비기한 사진" onLoad={() => { if (!photo.loaded) onPhotoChange({ ...photo, loaded: true }) }} onError={() => { setError('사진을 읽을 수 없습니다. 다른 이미지를 선택해주세요.'); onPhotoChange(null) }} className="max-h-40 max-w-full rounded-lg object-contain shadow-md" /> : <button type="button" onClick={() => cameraRef.current.click()} className="flex min-h-28 flex-col items-center justify-center gap-2 text-white"><Camera aria-hidden="true" className="size-8" /><span className="text-xs">영수증이나 소비기한을 촬영해주세요</span></button>}
      <div role="status" className="absolute right-5 bottom-3 left-5 flex items-center justify-center gap-1 rounded-full bg-white/95 px-2 py-2 text-center text-[10px] text-[#334155]">{recognizedCount > 0 ? <><CheckCircle2 aria-hidden="true" className="size-3 shrink-0 text-[#006c49]" />{recognizedCount}개 식재료를 인식했어요!</> : (photo?.loaded ? '사진이 준비됐어요. 인식 기능은 API 연결 후 제공됩니다.' : '영수증 또는 소비기한 사진을 선택해주세요.')}</div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#4c535d] px-3 py-2 text-[10px] text-[#e2e8f0]"><span className="flex items-center gap-1"><ReceiptText aria-hidden="true" className="size-3" />스마트 영수증 OCR 모드</span><div className="flex gap-1"><button type="button" onClick={() => cameraRef.current.click()} className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5"><RotateCcw aria-hidden="true" className="size-3" />다시 촬영</button><button type="button" onClick={() => albumRef.current.click()} className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5"><Images aria-hidden="true" className="size-3" />앨범 변경</button></div></div>
    {error && <p role="alert" className="bg-white p-3 text-xs text-red-600">{error}</p>}
    <input ref={cameraRef} aria-label="카메라 사진 선택" type="file" accept="image/*" capture="environment" onChange={handlePhotoSelection} className="hidden" /><input ref={albumRef} aria-label="앨범 사진 선택" type="file" accept="image/*" onChange={handlePhotoSelection} className="hidden" />
  </section>
}
