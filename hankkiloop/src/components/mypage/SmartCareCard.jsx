import bell from '../../assets/icons/smart-care-bell.svg'
import ToggleSwitch from './ToggleSwitch'
export default function SmartCareCard({ expirationAlert, onExpirationChange, recipeSuggestionAlert, onRecipeChange }) {
  const alerts = [
    { title: '소비기한 임박 알림', description: '소비기한 1~2일 전 아침 9시 알림', checked: expirationAlert, onChange: onExpirationChange },
    { title: '식재료 소진 레시피 제안', description: '퇴근길 저녁 메뉴 제안 (오후 6시)', checked: recipeSuggestionAlert, onChange: onRecipeChange },
  ]
  return (
    <section aria-labelledby="smart-care-heading" className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-xs">
      <h2 id="smart-care-heading" className="flex items-center gap-2 text-[17px] leading-6 text-[#161c25]"><img src={bell} alt="" className="size-[16.7px]" />스마트 소비 케어 알림</h2>
      <div className="flex flex-col gap-3">
        {alerts.map(({ title, description, checked, onChange }) => <div key={title} className="flex items-center justify-between gap-2 py-1"><div className="min-w-0"><h3 className="text-sm leading-5 text-[#161c25]">{title}</h3><p className="text-[11px] leading-[14px] tracking-[0.22px] text-[#3c4a42]">{description}</p></div><ToggleSwitch label={title} checked={checked} onChange={onChange} /></div>)}
      </div>
    </section>
  )
}
