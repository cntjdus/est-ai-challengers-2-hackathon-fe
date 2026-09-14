import NotificationButton from '../common/NotificationButton'
import leaf from '../../assets/icons/onboarding-leaf.svg'
export default function PreferenceHeader() {
  return <header className="flex h-app-header shrink-0 items-center gap-1.5 px-5 text-lg leading-7 text-[#111827]"><img src={leaf} alt="" className="size-[17.46px]" />한끼루프<div className="ml-auto flex items-center gap-1"><NotificationButton /><span aria-hidden="true" className="size-10 shrink-0" /></div></header>
}
