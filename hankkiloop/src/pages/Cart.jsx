import { useRef, useState } from 'react'
import { ArrowLeft, ListChecks, ShieldCheck } from 'lucide-react'
import HomeHeader from '../components/home/HomeHeader'
import BottomNavigation from '../components/common/BottomNavigation'
import Checkbox from '../components/common/Checkbox'
import CartItemCard from '../components/cart/CartItemCard'

export default function Cart({ items, onItemsChange, onStartRegistration, registrationMessage, onNavigate, onBack, loading = false, error = '', onRetry }) {
  const [notice, setNotice] = useState(registrationMessage ?? '')
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  const changeItems = async (update) => {
    if (lock.current || loading || error) return
    lock.current = true; setSaving(true); setNotice('')
    try { await onItemsChange(update) }
    catch (failure) { setNotice('저장 실패: ' + failure.message) }
    finally { lock.current = false; setSaving(false) }
  }
  const selected = items.filter((item) => item.selected)
  const selectedCount = selected.length
  const allSelected = items.length > 0 && selectedCount === items.length
  const handleToggleItem = (id) => changeItems((current) => current.map((item) => item.id === id ? { ...item, selected: !item.selected } : item))
  const handleToggleAll = () => changeItems((current) => current.map((item) => ({ ...item, selected: !allSelected })))
  const handleQuantityChange = (id, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return
    changeItems((current) => current.map((item) => item.id === id ? { ...item, quantity } : item))
  }
  const handleRemoveItem = (id) => changeItems((current) => current.filter((item) => item.id !== id))
  const handleDeleteSelected = () => changeItems((current) => current.filter((item) => !item.selected))
  const handleCompleteShopping = () => {
    if (!selectedCount || loading || error || saving) return
    onStartRegistration(selected)
  }
  return <div className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcf9] text-[#161c25]">
    <HomeHeader pageLabel="장보기" onProfile={() => onNavigate('/mypage')} onNotifications={() => setNotice('새로운 알림이 없습니다.')} />
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#edf1ef] px-4"><button type="button" onClick={onBack} aria-label="뒤로가기" className="flex size-9 items-center justify-center rounded-full"><ArrowLeft aria-hidden="true" className="size-6" /></button><h1 className="text-xl">장바구니</h1><span aria-label="장바구니 품목 수" className="flex size-6 items-center justify-center rounded-full bg-[#e2efe9] text-sm font-semibold text-[#006c49]">{items.length}</span><button type="button" disabled={!selectedCount || loading || saving || !!error} onClick={handleDeleteSelected} className="ml-auto py-2 text-xs text-[#596a60] disabled:opacity-40">선택 삭제</button></header>
    <main aria-label="장바구니 상품" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-20">
      {loading && <p role="status">장바구니를 불러오는 중…</p>}
      {error && <div role="alert"><p>{error}</p><button onClick={onRetry}>다시 불러오기</button></div>}
      {saving && <p role="status">저장 중…</p>}
      <p className="mb-3 text-xs text-[#64748b]">담을 당시의 재고 기준입니다. 구매 전에 수량을 확인해주세요. +/−는 최초 부족량의 배수이며 실제 구매량은 등록 화면에서 조정할 수 있어요.</p>
      {notice && <p role="status" className="mb-3 rounded-xl bg-[#e2efe9] p-3 text-xs text-[#006c49]">{notice}</p>}
      <div className="mb-4 flex items-center gap-2"><Checkbox label="장바구니 전체 선택" checked={allSelected} mixed={selectedCount > 0 && !allSelected} disabled={!items.length} onChange={handleToggleAll} /><span className="text-sm font-bold">전체 선택 ({selectedCount}/{items.length})</span></div>
      <div className="space-y-4">{items.map((item) => <CartItemCard key={item.id} item={item} onOpen={() => { if (!loading && !saving && !error) onStartRegistration([item]) }} onToggle={handleToggleItem} onRemove={handleRemoveItem} onQuantityChange={handleQuantityChange} />)}</div>
      {!loading && !error && !items.length && <div className="py-14 text-center text-sm text-[#7c8595]"><p>장바구니가 비어 있어요.</p><button onClick={() => onNavigate('/recipe')} className="mt-3 underline">레시피에서 부족한 재료 담기</button></div>}
    </main>
    <section aria-label="장보기 완료" className="shrink-0 bg-white px-5 pt-3 pb-3"><div className="flex items-center gap-3"><div className="shrink-0"><p className="text-[11px] text-[#596a60]">선택 품목</p><p className="mt-1 text-xs"><strong className="mr-1 text-2xl">{selectedCount}</strong>개 담김</p></div><button type="button" disabled={!selectedCount || loading || saving || !!error} onClick={handleCompleteShopping} className="ml-auto flex min-h-13 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#006c49] px-2 py-2 text-xs font-bold text-white disabled:opacity-40"><ListChecks aria-hidden="true" className="size-4 shrink-0" />장보기 완료하고 냉장고 등록</button></div><p className="mt-2 flex items-start justify-center gap-1 text-[10px] font-semibold leading-4 text-[#596a60]"><ShieldCheck aria-hidden="true" className="size-3.5 shrink-0 text-[#006c49]" />다음 화면에서 실제 구매량·소비기한·보관장소를 확인한 뒤 등록합니다</p></section>
    <BottomNavigation onNavigate={onNavigate} />
  </div>
}
