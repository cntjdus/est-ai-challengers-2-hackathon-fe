import { useState } from 'react'
import { ArrowRight, Bot, Image, Pencil, Refrigerator, Snowflake, Sun, Timer } from 'lucide-react'
import EditProfileHeader from '../components/profile/EditProfileHeader'
import BottomNavigation from '../components/common/BottomNavigation'
import RecipeCard from '../components/recipe/RecipeCard'
import { buildFridgeItems, expiryLabel, storageLabels, statusVariants } from '../data/inventory'

import character from '../assets/hankkiloop-character.png'

const storageIcons = { fridge: Refrigerator, freezer: Snowflake, room: Sun }
export default function IngredientDetail({ recipes = [], itemId, inventory, registeredMaterials, onBack, onNavigate, onBrowseRecipes, onUpdate, onRemove }) {
  const [amountNotice, setAmountNotice] = useState(false)
  const item = buildFridgeItems(inventory, registeredMaterials).find((entry) => entry.id === itemId)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const handleEditAmount = () => { setDraft({ name: item.name, quantity: String(item.amount), storage: item.storageType, date: item.expiryDate }); setAmountNotice(!amountNotice); setError('') }
  const save = async () => {
    if (saving) return
    setSaving(true); setError('')
    try { await onUpdate(item.id, draft); setAmountNotice(false) } catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  const remove = async () => {
    if (saving) return
    setSaving(true); setError('')
    try { await onRemove(item.id) } catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  if (!item) return <div className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8f9ff]">
    <EditProfileHeader plain title="식재료 상세" align="left" dot onBack={onBack} />
    <main className="min-h-0 flex-1 overflow-y-auto px-5 py-12 text-center"><h2 className="text-base">식재료 정보를 찾을 수 없습니다.</h2><p className="mt-2 text-xs text-[#7c8595]">재료가 모두 소진되었거나 등록되지 않은 주소예요.</p><button type="button" onClick={() => onNavigate('/fridge')} className="mt-6 rounded-xl bg-[#006c49] px-5 py-3 text-sm text-white">냉장고로 돌아가기</button></main><BottomNavigation onNavigate={onNavigate} />
  </div>
  const StorageIcon = storageIcons[item.storageType] ?? Refrigerator
  const recommended = recipes.filter(recipe => recipe.ingredients.some(ingredient => ingredient.name === item.name && ingredient.unit === item.unit))
  const purchase = !item.purchaseDate ? '날짜 미등록' : new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(item.purchaseDate + 'T12:00:00'))
  return <div className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#f8f9ff] text-[#1e293b]">
    <div className="shrink-0 bg-white"><EditProfileHeader title="식재료 상세" align="left" dot plain onBack={onBack} /></div>
    <main aria-label="식재료 상세" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-7">
      <section aria-label="식재료 정보" className="rounded-3xl border border-[#d1fae5] bg-white p-3.5 shadow-xs">
        <div className="relative flex aspect-[1.7] items-center justify-center overflow-hidden rounded-2xl bg-[#edf3ef]">
          {item.image ? <img src={item.image} alt={item.name + ' 식재료 사진'} className="size-full object-cover" /> : <div role="img" aria-label={item.name + ' 사진 영역'} className="flex flex-col items-center gap-2 text-[#94a89c]"><Image aria-hidden="true" className="size-10" /><span className="text-xs">{item.name}</span></div>}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusVariants[item.status].className}`}><Timer aria-hidden="true" className="size-3" />{item.daysLeft > 0 ? '소비 권장 ' : ''}{expiryLabel(item.daysLeft)}</span><span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] text-[#008768]">{item.category} · {storageLabels[item.storageType]}</span></div>
        </div>
        <div className="mt-4 flex items-start justify-between gap-2"><div className="flex min-w-0 flex-wrap items-center gap-2"><h2 className="break-words text-xl" data-testid="ingredient-name">{item.name}</h2>{item.packageState && <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] text-[#008768]">{item.packageState}</span>}</div>{item.englishName && <span className="shrink-0 pt-1 text-[11px] font-semibold text-[#98a2b3]">{item.englishName}</span>}</div>
        <p className="mt-2 flex items-start gap-2 pb-1 text-xs leading-5 text-[#667085]"><StorageIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#008768]" />{item.storageDetail}</p>
      </section>
      <section aria-label="보관 요약" className="grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-2xl border border-[#d1fae5] bg-white px-1.5 py-3 text-center shadow-xs"><h3 className="text-[10px] text-[#8792a2]">남은 양</h3><button type="button" aria-label="남은 양 수정" aria-expanded={amountNotice} onClick={handleEditAmount} className="mt-1 flex w-full items-center justify-center gap-1 text-base font-bold text-[#008768]"><span className="break-all" data-testid="ingredient-amount">{item.amount}{item.unit}</span><Pencil aria-hidden="true" className="size-3 shrink-0 text-[#98a2b3]" /></button><p className="mt-1 text-[9px] text-[#98a2b3]">{item.servingEstimate}</p></div>
        <div className="min-w-0 rounded-2xl border border-[#d1fae5] bg-white px-1.5 py-3 text-center shadow-xs"><h3 className="text-[10px] text-[#8792a2]">보관 상태</h3><p className="mt-2 flex items-center justify-center gap-0.5 text-[11px]"><StorageIcon aria-hidden="true" className="size-3 shrink-0 text-[#008768]" />{item.storageName}</p><p className="mt-1 text-[9px] text-[#008768]">{item.optimalTemperature}</p></div>
        <div className="min-w-0 rounded-2xl border border-[#d1fae5] bg-white px-1.5 py-3 text-center shadow-xs"><h3 className="text-[10px] text-[#8792a2]">등록/구매일</h3><p className="mt-2 text-xs font-semibold">{purchase}</p><p className="mt-1 text-[9px] text-[#f59e0b]">{item.storedDays}일째 보관 중</p></div>
      </section>
      {amountNotice && draft && <fieldset disabled={saving} className="space-y-3 rounded-2xl bg-white p-4">
        <legend>재료 정보 수정</legend>
        <label className="block">이름<input aria-label="재료 이름 수정" className="block w-full border p-2" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <label className="block">남은 수량 ({item.unit})<input aria-label="남은 수량" type="number" min="0.0001" step="0.0001" className="block w-full border p-2" value={draft.quantity} onChange={e => setDraft({ ...draft, quantity: e.target.value })} /></label>
        <label className="block">보관장소<select aria-label="보관장소 수정" value={draft.storage} onChange={e => setDraft({ ...draft, storage: e.target.value })}>{Object.entries(storageLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="block">소비기한<input aria-label="소비기한 수정" type="date" min={item.purchaseDate} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label>
        <button type="button" onClick={save} className="rounded-xl bg-[#006c49] px-5 py-3 text-white">{saving ? '저장 중…' : '변경 내용 저장'}</button>
      </fieldset>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="rounded-2xl bg-white p-4">{confirmRemove ? <><p className="text-sm">이 재료를 폐기 처리하고 냉장고 목록에서 제거할까요?</p><button type="button" disabled={saving} onClick={remove} className="mr-4 mt-3 text-red-600">폐기 처리</button><button type="button" disabled={saving} onClick={() => setConfirmRemove(false)}>취소</button></> : <button type="button" onClick={() => setConfirmRemove(true)} className="text-sm text-red-600">냉장고에서 제거</button>}</div>
      <section aria-label="신선도와 보관 팁" className="rounded-3xl border border-[#a7f3d0] bg-gradient-to-br from-[#f6fcfa] to-[#eaf9f4] p-4 shadow-xs">
        <div className="flex items-center gap-3"><div className="relative size-13 shrink-0 overflow-hidden rounded-2xl"><img src={character} alt="" className="absolute top-[-12%] left-[-2%] w-[255%] max-w-none" /></div><div><span className="inline-flex items-center gap-1 rounded-full bg-[#dff3eb] px-2 py-1 text-[9px] text-[#008768]"><Bot aria-hidden="true" className="size-3" />소비기한 및 보관 안내</span><h2 className="mt-1 text-sm">제품 표시를 기준으로 확인해주세요</h2></div></div>
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm">{item.expiryDate ? '등록한 소비기한: ' + item.expiryDate + ' · ' + expiryLabel(item.daysLeft) : '소비기한이 등록되지 않았어요.'}</p>
        <div className="relative mt-3 rounded-2xl border border-[#a7f3d0]/70 bg-white p-3 text-xs leading-5 text-[#475467] before:absolute before:-top-1.5 before:left-6 before:size-3 before:rotate-45 before:border-t before:border-l before:border-[#a7f3d0]/70 before:bg-white"><p>{item.storageTip}</p></div>
      </section>
      <section aria-label="소진 추천 레시피" className="pt-1"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="min-w-0 break-words text-sm">{item.name} 소진 추천 레시피</h2><span className="shrink-0 rounded-full bg-[#ecfdf5] px-2 py-1 text-[9px] text-[#008768]">소진 우선순위</span></div><div className="space-y-2">{recommended.slice(0, 2).map((recipe) => { const used = recipe.ingredients.find((entry) => entry.name === item.name && entry.unit === item.unit); return <RecipeCard key={recipe.id} recipe={recipe} compact usage={used ? used.name + ' ' + Number((used.quantity * (used.unit === item.unit ? 1 : item.displayPerUnit)).toFixed(2)) + item.unit + ' 소진' : ''} onOpen={() => onNavigate('/recipe/' + recipe.id)} /> })}{!recommended.length && <p className="rounded-2xl border border-[#d1fae5] bg-white p-5 text-center text-xs text-[#8792a2]">아직 연결된 추천 레시피가 없어요.</p>}</div></section>
      <button type="button" onClick={() => onBrowseRecipes(item.name)} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#006c49] px-3 py-3 text-sm text-white shadow-lg">이 재료 활용 레시피 보러가기<ArrowRight aria-hidden="true" className="size-4" /></button>
    </main>
    <BottomNavigation onNavigate={onNavigate} />
  </div>
}
