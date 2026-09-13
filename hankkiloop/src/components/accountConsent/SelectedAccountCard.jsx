import AccountAvatar from '../common/AccountAvatar'

export default function SelectedAccountCard({ account }) {
  return (
    <section aria-label="선택한 Google 계정" className="flex items-center justify-between gap-2 rounded-2xl border border-[#d1fae5]/80 bg-white p-[17px] shadow-xs">
      <div className="flex min-w-0 items-center gap-3">
        <AccountAvatar nickname={account.nickname} />
        <div className="min-w-0">
          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-sm leading-[17.5px] font-bold text-[#111827]">{account.name}</span>
            <span className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] leading-[15px] text-[#4b5563]">연결 대기</span>
          </div>
          <p className="break-all text-xs leading-4 text-[#64748b]">{account.email}</p>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-[#006c49]/5 px-2.5 py-1 text-[11px] leading-[16.5px] font-semibold text-[#006c49]">선택됨</span>
    </section>
  )
}
