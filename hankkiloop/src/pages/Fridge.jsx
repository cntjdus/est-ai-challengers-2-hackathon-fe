import { useMemo, useRef, useState } from 'react'
import { ArrowDownUp, CircleAlert, CirclePlus, Radio, Refrigerator, Search, Snowflake, Sun, X } from 'lucide-react'
import HomeHeader from '../components/home/HomeHeader'
import BottomNavigation from '../components/common/BottomNavigation'
import FridgeItemCard from '../components/fridge/FridgeItemCard'
import { buildFridgeItems, storageLabels } from '../data/inventory'
import character from '../assets/hankkiloop-character.png'

const filters = [{ id: 'all', label: '전체' }, { id: 'fridge', icon: Refrigerator }, { id: 'freezer', icon: Snowflake }, { id: 'room', icon: Sun }]
export default function Fridge({ inventory, registeredMaterials, onNavigate, onAdd, registrationMessage }) {
  const [query, setQuery] = useState('')
  const [storage, setStorage] = useState('all')
  const [sort, setSort] = useState('expiry')
  const alertRef = useRef(null)
  const items = useMemo(() => buildFridgeItems(inventory, registeredMaterials), [inventory, registeredMaterials])
  const allUrgent = items.filter((item) => item.daysLeft !== null && item.daysLeft <= 2).sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))
  const visible = items.filter((item) => (storage === 'all' || storage === item.storageType) && item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => sort === 'expiry' ? (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity) : b.purchaseDate.localeCompare(a.purchaseDate))
  const urgent = visible.filter((item) => item.daysLeft !== null && item.daysLeft <= 2).sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))
  return <div className="mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcf9] text-[#202833]">
    <HomeHeader pageLabel="냉장고" onProfile={() => onNavigate('/mypage')} onNotifications={() => alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
    <main aria-label="냉장고" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-20">
      {registrationMessage && <p role="status" className="mb-3 rounded-xl bg-[#ecfdf5] p-3 text-xs text-[#007f5c]">{registrationMessage}</p>}
      <div className="flex items-end justify-between gap-2"><div><span className="inline-flex items-center gap-1 rounded-full bg-[#dcece4] px-2 py-0.5 text-[10px] text-[#008768]"><Radio aria-hidden="true" className="size-3" />실시간 재고 관리</span><h2 className="mt-1.5 text-[23px] leading-8 tracking-tight">내 스마트 냉장고</h2></div><span data-testid="inventory-count" className="mb-1 shrink-0 rounded-full border border-[#e0e8e9] bg-[#eef4ff] px-3 py-2 text-xs text-[#53665b]"><span aria-hidden="true" className="mr-1 text-[#007f5c]">●</span> 총 <strong className="text-[#008768]">{items.length}개</strong> 보관</span></div>
      <aside ref={alertRef} className="mt-5 flex scroll-mt-4 items-center gap-3 rounded-2xl border border-[#d1fae5] bg-[#effcf4] p-4">
        <img src={character} alt="" className="size-16 shrink-0 rounded-2xl border border-[#a7f3d0] object-cover shadow-xs" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><span className="rounded-full bg-[#fff3c4] px-2 py-1 text-[10px] text-[#ba631d]">소비 케어 알림</span><span className="text-[10px] text-[#87998b]">똑똑한 AI 비서</span></div><h3 className="mt-1 text-[15px] leading-6">{allUrgent.length ? allUrgent.slice(0, 2).map((item) => item.name).join(', ') + ' 확인해주세요!' : '내 냉장고를 한눈에 살펴보세요'}</h3><p className="mt-0.5 text-xs leading-4 text-[#68786d]">{allUrgent.some((item) => item.daysLeft < 0) ? '소비기한이 지난 재료가 있어요. 제품 상태와 표시를 확인해주세요.' : allUrgent.length ? '소비기한이 얼마 남지 않았어요. 오늘 요리에 활용해보세요.' : '재료를 등록하고 보관량과 소비기한을 관리해보세요.'}</p></div>
      </aside>
      <div className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[#f1f4ef] bg-white px-4 shadow-xs"><Search aria-hidden="true" className="size-5 shrink-0 text-[#7b8c80]" /><input type="search" aria-label="보관 중인 재료 검색" placeholder="보관 중인 재료 검색 (예: 대파, 두부, 계란)" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#bccdc1]" />{query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}><X className="size-4" /></button>}</div>
      <div aria-label="보관 방식" className="mt-3 flex gap-2 overflow-x-auto pb-2">{filters.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={storage === id} onClick={() => setStorage(id)} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eff3ff] px-3.5 py-2 text-xs text-[#68786d] aria-pressed:bg-[#007450] aria-pressed:text-white">{Icon && <Icon aria-hidden="true" className="size-4" />}{label ?? storageLabels[id]}<span className="rounded-full bg-white/30 px-1.5">{id === 'all' ? items.length : items.filter((item) => item.storageType === id).length}</span></button>)}</div>
      {!items.length ? <p className="py-12 text-center text-sm text-[#78867e]">아직 등록된 재료가 없어요.</p> : !visible.length ? <p role="status" className="py-12 text-center text-sm text-[#78867e]">조건에 맞는 재료가 없어요.</p> : <>
        <section aria-label="먼저 먹어야 하는 재료" className="mt-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-1.5 text-[15px]"><CircleAlert aria-hidden="true" className="size-5 text-[#f04452]" />먼저 먹어야 하는 재료<span className="rounded-full bg-[#ffe3e4] px-1.5 py-1 text-[10px] text-[#f04452]">{urgent.length}개 임박</span></h2><span className="text-[10px] text-[#87998b]">소비 권장순</span></div><div className="space-y-3">{urgent.map((item) => <FridgeItemCard key={item.id} item={item} onOpen={(id) => onNavigate('/fridge/' + encodeURIComponent(id))} urgent />)}{!urgent.length && <p className="py-4 text-center text-xs text-[#78867e]">소비기한이 임박한 재료가 없어요.</p>}</div></section>
        <section aria-label="모든 식재료" className="mt-10"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="flex items-center gap-1.5 text-lg">모든 식재료<span className="rounded-full bg-[#e1efe8] px-2 py-0.5 text-[10px] text-[#008768]">목록</span></h2><button type="button" aria-label="정렬 변경" onClick={() => setSort(sort === 'expiry' ? 'purchase' : 'expiry')} className="flex items-center gap-1 text-[11px] text-[#68786d]"><ArrowDownUp aria-hidden="true" className="size-3.5" />{sort === 'expiry' ? '소비기한 임박순' : '최근 구매순'}</button></div><div className="space-y-2" data-testid="fridge-list">{visible.map((item) => <FridgeItemCard key={item.id} item={item} onOpen={(id) => onNavigate('/fridge/' + encodeURIComponent(id))} />)}</div></section>
      </>}
    </main>
    <div className="shrink-0 bg-[#fafcf9] px-5 py-4"><button type="button" onClick={onAdd} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#005e49] text-base text-white shadow-xs"><CirclePlus aria-hidden="true" className="size-5" />직접 재료 추가</button></div>
    <BottomNavigation onNavigate={onNavigate} />
  </div>
}
