import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, Camera, CheckCircle2, Snowflake, Store, X } from 'lucide-react'
import EditProfileHeader from '../components/profile/EditProfileHeader'
import BottomNavigation from '../components/common/BottomNavigation'
import IngredientRegisterForm from '../components/register/IngredientRegisterForm'
import PhotoRecognitionSection from '../components/register/PhotoRecognitionSection'
import character from '../assets/hankkiloop-character.png'
import { calculateExpiryDate, createDirectRegistrationDraft, createRegistrationDraft, solutionOptions, storageGuides, validateMaterial } from '../data/materialRegistration'

export default function MaterialRegister({ items, source, onNavigate, onBack, onRegister }) {
  const [materials, setMaterials] = useState(() => (history.state?.registrationDraft ?? (source === 'fridge-direct' ? createDirectRegistrationDraft() : createRegistrationDraft(items))).map((item) => ({ ...item, recognizedFromPhoto: false })))
  const [mode, setMode] = useState('manual')
  const [solution, setSolution] = useState('freeze')
  const [activeIndex, setActiveIndex] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const submitted = useRef(false)
  const formRef = useRef(null)
  const material = materials[activeIndex]
  const recognizedIngredients = materials.filter((item) => item.recognizedFromPhoto)
  useEffect(() => { history.replaceState({ ...history.state, registrationDraft: materials }, '', location.href) }, [materials])
  const handleMaterialChange = (changes) => {
    setError('')
    setMaterials((current) => current.map((item, index) => {
      if (index !== activeIndex) return item
      const next = { ...item, ...changes }
      if ('storageType' in changes || 'purchaseDate' in changes) {
        next.expiryDate = calculateExpiryDate(next.storageType, next.purchaseDate)
        next.expiryAutomatic = true
        next.storageGuide = storageGuides[next.storageType]
      }
      return next
    }))
  }
  const handlePhotoChange = (nextPhoto) => {
    setPhoto(nextPhoto)
    if (nextPhoto?.url !== photo?.url) setMaterials((current) => current.map((item) => ({ ...item, recognizedFromPhoto: false })))
  }
  const handleRegisterToFridge = () => {
    if (submitted.current || !materials.length) return
    const invalidIndex = materials.findIndex((item) => validateMaterial(item))
    if (invalidIndex !== -1) {
      setActiveIndex(invalidIndex)
      setError(validateMaterial(materials[invalidIndex]))
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    try {
      // TODO: 냉장고 등록 API 연결. 성공한 뒤에만 장바구니에서 제거합니다.
      onRegister(materials)
      submitted.current = true
    } catch (failure) { setError(failure.message) }
  }
  return <div className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcf9] text-[#1e293b]">
    <EditProfileHeader title="재료 등록" plain onBack={onBack} action={<button type="button" aria-label="재료 등록 닫기" onClick={() => onNavigate(source === 'fridge-direct' ? '/fridge' : '/shopping')} className="flex size-9 items-center justify-center rounded-full"><X aria-hidden="true" className="size-5" /></button>} />
    <main aria-label="재료 등록" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-10 pb-6">
      {!material ? <div className="py-12 text-center"><p className="text-sm">등록할 재료가 없습니다.</p><button type="button" onClick={() => onNavigate(source === 'fridge-direct' ? '/fridge' : '/shopping')} className="mt-5 rounded-xl bg-[#006c49] px-5 py-3 text-sm text-white">장바구니로 돌아가기</button></div> : <>
        <aside className="flex items-center gap-3 rounded-2xl border border-[#d1fae5] bg-[#effcf4] p-4"><img src={character} alt="" className="size-12 shrink-0 rounded-2xl object-cover" /><div className="min-w-0"><span className="rounded-full border border-[#d1fae5] bg-white px-2 py-1 text-[10px] text-[#008768]">{source === 'fridge-direct' ? '직접 재료 추가' : '장바구니 연동'}</span><p className="mt-1.5 text-xs leading-4 text-[#1b4535]">{source === 'fridge-direct' ? '추가할 재료의 이름과 보관 정보를 입력해주세요.' : <>장바구니에 담은 <strong className="text-[#008768] underline">{material.ingredientName} {material.purchaseAmount}{material.unit}</strong>{materials.length > 1 ? ' 외 ' + (materials.length - 1) + '개 재료를' : '을'} 내 냉장고에 등록할게요!</>}</p></div></aside>
        <section className="mt-5"><h2 className="mb-2 text-[11px] tracking-wide text-[#94a3b8]">추천 솔루션 선택</h2><div className="grid grid-cols-2 gap-3">{solutionOptions.map((option) => { const Icon = option.id === 'freeze' ? Snowflake : Store; return <button key={option.id} type="button" aria-pressed={solution === option.id} onClick={() => setSolution(option.id)} className="rounded-2xl border border-[#e2e8f0] bg-white p-3 text-left aria-pressed:border-[#1b4535] aria-pressed:bg-[#f0f8f4] aria-pressed:shadow-md"><span className="mb-3 flex size-9 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#008768]"><Icon aria-hidden="true" className="size-4" /></span><h3 className="text-sm">{option.title}</h3><p className="mt-1 text-[10px] leading-4 text-[#7c8595]">{option.description}<br /><span className="text-[#008768]">{option.highlight}</span></p><span className="mt-3 flex items-center justify-between border-t border-[#edf3ef] pt-2 text-[10px] text-[#94a3b8]">{option.footer}<CheckCircle2 aria-hidden="true" className={solution === option.id ? 'size-3 fill-[#1b4535] text-white' : 'size-3'} /></span></button> })}</div></section>
        <div aria-label="입력 방식" className="my-6 grid grid-cols-2 gap-1 rounded-2xl bg-[#f1f3f4] p-1">{[{ id: 'manual', label: '직접·달력 입력', icon: CalendarDays }, { id: 'photo', label: '사진 촬영(소비기한)', icon: Camera }].map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className="flex min-h-9 items-center justify-center gap-1 rounded-xl px-1 text-[11px] text-[#7c8595] aria-pressed:bg-[#10b981] aria-pressed:text-white"><Icon aria-hidden="true" className="size-3.5 shrink-0" />{label}</button>)}</div>
        <div hidden={mode !== 'photo'}><PhotoRecognitionSection photo={photo} onPhotoChange={handlePhotoChange} recognizedCount={recognizedIngredients.length} /></div>
        {(materials.length > 1 || mode === 'photo') && <section className="my-5"><h2 className="text-sm">{mode === 'photo' ? '인식된 식재료' : '등록할 식재료'} <span className="rounded-full bg-[#e2efe9] px-1.5 text-xs text-[#006c49]">{mode === 'photo' ? recognizedIngredients.length : materials.length}</span></h2><div className="mt-2 flex flex-wrap gap-2">{materials.map((item, index) => <button type="button" key={item.id} aria-pressed={index === activeIndex} onClick={() => { setActiveIndex(index); setError('') }} className="rounded-full border border-[#e2e8f0] px-3 py-1.5 text-xs text-[#64748b] aria-pressed:border-[#10b981] aria-pressed:bg-[#ecfdf5] aria-pressed:text-[#006c49]">{item.ingredientName || '이름 없음'}</button>)}</div></section>}
        <div ref={formRef} className="scroll-mt-4"><IngredientRegisterForm material={material} onChange={handleMaterialChange} /></div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="button" onClick={handleRegisterToFridge} className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#006c49] px-3 py-3 text-sm text-white shadow-md">확인하고 냉장고에 등록하기<ArrowRight aria-hidden="true" className="size-4" /></button>
        {materials.length > 1 && <p className="mt-2 text-center text-[10px] text-[#7c8595]">선택한 {materials.length}개 재료를 함께 등록합니다.</p>}
      </>}
    </main>
    <BottomNavigation onNavigate={onNavigate} />
  </div>
}
