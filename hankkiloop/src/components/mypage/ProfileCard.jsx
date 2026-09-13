import edit from '../../assets/icons/profile-edit.svg'
import { householdLabels, cookingLabels } from '../../data/preferences'
export default function ProfileCard({ account, nickname, preferences, onEdit }) {
  return (
    <section aria-label="프로필 정보" className="flex flex-col gap-3.5 rounded-2xl border border-[#dde3ef]/60 bg-white p-[17px] shadow-xs">
      <div className="flex items-center gap-3.5">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[#006c49]/20 bg-[#006c49]/10 text-sm font-black text-[#006c49] shadow-inner">{account.name?.trim().slice(-2) || account.nickname || '회원'}</span>
        <div className="min-w-0 flex-1">
          <h2 className="break-all text-[17px] leading-6 tracking-[-0.17px] text-[#161c25]">{nickname}</h2>
          <p className="mt-0.5 break-all text-xs leading-4 text-[#64748b]">{account.email}</p>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] leading-5 text-[#3c4a42]">
            <span className="rounded-md bg-[#e9eefb] px-2 py-0.5">{householdLabels[preferences.householdType] ?? preferences.householdType}</span>
            <span className="rounded-md bg-[#e9eefb] px-2 py-0.5">{cookingLabels[preferences.cookingFrequency] ?? preferences.cookingFrequency}</span>
          </div>
        </div>
      </div>
      <button type="button" onClick={onEdit} className="mt-0.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#006c49]/20 bg-[#006c49]/10 px-3 py-2.5 text-[13px] text-[#006c49]">
        <img src={edit} alt="" className="h-3 w-3.5" />개인정보 수정
      </button>
    </section>
  )
}
