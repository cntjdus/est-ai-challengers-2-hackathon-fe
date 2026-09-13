import AccountAvatar from '../common/AccountAvatar'
import verifiedIcon from '../../assets/icons/onboarding-shield.svg'
import smileIcon from '../../assets/icons/nickname-smile.svg'

export default function LinkedAccountCard({ account, nickname, onNicknameChange, onChangeAccount }) {
  const isValid = nickname.trim().length > 0
  return (
    <section aria-labelledby="linked-account-title" className="flex flex-col gap-3.5 rounded-2xl border border-[#f1f5f9] bg-white p-[17px] shadow-xs">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-[11px] text-xs leading-4">
        <h2 id="linked-account-title" className="text-[#94a3b8]">연동 계정</h2>
        <span className="flex items-center gap-1 text-[#047857]"><img src={verifiedIcon} alt="" className="size-[11px]" />인증됨</span>
      </div>
      <div className="flex items-center gap-3">
        <AccountAvatar nickname={account.nickname} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-sm leading-5 text-[#1e293b]">{account.name}</span>
            <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] leading-[15px] text-[#64748b]">기본</span>
          </div>
          <p className="break-all text-xs leading-4 text-[#64748b]">{account.email}</p>
        </div>
        <button type="button" onClick={onChangeAccount} className="shrink-0 text-xs text-[#94a3b8] underline">변경</button>
      </div>
      <div className="flex flex-col gap-1.5 pt-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <label htmlFor="onboarding-nickname" className="text-xs leading-4 text-[#334155]">한끼루프에서 부를 닉네임</label>
          <span className="text-[11px] text-[#94a3b8]">언제든 변경 가능</span>
        </div>
        <div className="flex min-h-10 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]/80 px-3 focus-within:ring-2 focus-within:ring-[#047857]">
          <img src={smileIcon} alt="" className="size-3 shrink-0" />
          <input id="onboarding-nickname" value={nickname} onChange={(event) => onNicknameChange(event.target.value)} aria-invalid={!isValid} aria-describedby="nickname-status" className="min-w-0 flex-1 bg-transparent py-2.5 text-xs leading-4 text-[#1e293b] outline-none" />
          <span id="nickname-status" aria-live="polite" className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] ${isValid ? 'border-[#a7f3d0]/80 bg-[#ecfdf5] text-[#047857]' : 'border-red-200 bg-red-50 text-red-600'}`}>{isValid ? '사용 가능' : '입력 필요'}</span>
        </div>
      </div>
    </section>
  )
}
