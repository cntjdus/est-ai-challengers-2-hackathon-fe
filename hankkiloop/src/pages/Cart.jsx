import { useState } from 'react'
import { ArrowLeft, ListChecks, ShieldCheck } from 'lucide-react'
import HomeHeader from '../components/home/HomeHeader'
import BottomNavigation from '../components/common/BottomNavigation'
import Checkbox from '../components/common/Checkbox'
import CartItemCard from '../components/cart/CartItemCard'

export default function Cart({ items, onItemsChange, onStartRegistration, registrationMessage, onNavigate, onBack }) {
  const [notice, setNotice] = useState(registrationMessage ?? '')
  const selected = items.filter((item) => item.selected)
  const selectedCount = selected.length
  const allSelected = items.length > 0 && selectedCount === items.length
  const handleToggleItem = (id) => onItemsChange((current) => current.map((item) => item.id === id ? { ...item, selected: !item.selected } : item))
  const handleToggleAll = () => onItemsChange((current) => current.map((item) => ({ ...item, selected: !allSelected })))
  const handleQuantityChange = (id, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return
    onItemsChange((current) => current.map((item) => item.id === id ? { ...item, quantity } : item))
  }
  const handleRemoveItem = (id) => onItemsChange((current) => current.filter((item) => item.id !== id))
  const handleDeleteSelected = () => onItemsChange((current) => current.filter((item) => !item.selected))
  const handleCompleteShopping = () => {
    if (!selectedCount) return
    onStartRegistration(selected)
  }
  return <div className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcf9] text-[#161c25]">
    <HomeHeader pageLabel="장보기" onProfile={() => onNavigate('/mypage')} onNotifications={() => setNotice('새로운 알림이 없습니다.')} />
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#edf1ef] px-4"><button type="button" onClick={onBack} aria-label="뒤로가기" className="flex size-9 items-center justify-center rounded-full"><ArrowLeft aria-hidden="true" className="size-6" /></button><h1 className="text-xl">장바구니</h1><span aria-label="장바구니 품목 수" className="flex size-6 items-center justify-center rounded-full bg-[#e2efe9] text-sm font-semibold text-[#006c49]">{items.length}</span><button type="button" disabled={!selectedCount} onClick={handleDeleteSelected} className="ml-auto py-2 text-xs text-[#596a60] disabled:opacity-40">선택 삭제</button></header>
    <main aria-label="장바구니 상품" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-20">
      {notice && <p role="status" className="mb-3 rounded-xl bg-[#e2efe9] p-3 text-xs text-[#006c49]">{notice}</p>}
      <div className="mb-4 flex items-center gap-2"><Checkbox label="장바구니 전체 선택" checked={allSelected} mixed={selectedCount > 0 && !allSelected} disabled={!items.length} onChange={handleToggleAll} /><span className="text-sm font-bold">전체 선택 ({selectedCount}/{items.length})</span></div>
      <div className="space-y-4">{items.map((item) => <CartItemCard key={item.id} item={item} onOpen={() => onStartRegistration([item])} onToggle={handleToggleItem} onRemove={handleRemoveItem} onQuantityChange={handleQuantityChange} />)}</div>
      {!items.length && <p className="py-14 text-center text-sm text-[#7c8595]">장바구니가 비어 있어요.</p>}
    </main>
    <section aria-label="장보기 완료" className="shrink-0 bg-white px-5 pt-3 pb-3"><div className="flex items-center gap-3"><div className="shrink-0"><p className="text-[11px] text-[#596a60]">선택 품목</p><p className="mt-1 text-xs"><strong className="mr-1 text-2xl">{selectedCount}</strong>개 담김</p></div><button type="button" disabled={!selectedCount} onClick={handleCompleteShopping} className="ml-auto flex min-h-13 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#006c49] px-2 py-2 text-xs font-bold text-white disabled:opacity-40"><ListChecks aria-hidden="true" className="size-4 shrink-0" />장보기 완료하고 냉장고 등록</button></div><p className="mt-2 flex items-start justify-center gap-1 text-[10px] font-semibold leading-4 text-[#596a60]"><ShieldCheck aria-hidden="true" className="size-3.5 shrink-0 text-[#006c49]" />장보기 완료 시 유통기한과 보관장소가 냉장고에 자동 등록됩니다</p></section>
    <BottomNavigation onNavigate={onNavigate} />
  </div>
}
