import { House, BookOpen, ShoppingBag, Refrigerator, UserRound } from 'lucide-react'
const items = [
  { label: '레시피', path: '/recipe', icon: BookOpen },
  { label: '냉장고', path: '/fridge', icon: Refrigerator },
  { label: '홈', path: '/', icon: House },
  { label: '장보기', path: '/shopping', icon: ShoppingBag },
  { label: '마이페이지', path: '/mypage', icon: UserRound },
]
export default function BottomNavigation({ onNavigate }) {
  const pathname = location.pathname === '/shopping/register' ? '/shopping' : location.pathname === '/home' ? '/' : (location.pathname === '/recipes' || location.pathname.startsWith('/recipe/')) ? '/recipe' : location.pathname
  return <nav aria-label="하단 메뉴" className="z-10 shrink-0 border-t border-[#f1f5f9] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px]"><div className="grid h-bottom-nav grid-cols-5 items-center">{items.map(({ label, path, icon: Icon }) => <button key={path} type="button" aria-current={pathname === path ? 'page' : undefined} onClick={() => onNavigate(path)} className="relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] leading-[14px] text-[#98a2b3] aria-[current=page]:text-[#007f5c]"><Icon aria-hidden="true" className="size-[18px]" strokeWidth={pathname === path ? 2.5 : 2} />{label}{pathname === path && <span aria-hidden="true" className="absolute -bottom-1 size-1.5 rounded-full bg-current" />}</button>)}</div></nav>
}
