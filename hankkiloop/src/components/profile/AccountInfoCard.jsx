import google from '../../assets/google-logo.svg'
import shield from '../../assets/icons/onboarding-shield.svg'
import close from '../../assets/icons/close.svg'

export default function AccountInfoCard({ email, nickname, onNicknameChange, realName, onRealNameChange, isNicknameValid }) {
  return (
    <section aria-labelledby="account-info-heading" className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0]/80 bg-white p-[17px] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f5f9] pb-[11px]">
        <h2 id="account-info-heading" className="text-xs font-bold tracking-wide text-[#94a3b8]">계정 연동 정보</h2>
        <span className="flex items-center gap-1 rounded-full border border-[#a7f3d0]/70 bg-[#ecfdf5] px-2 py-0.5 text-[11px] text-[#047857]"><img src={shield} alt="" className="size-2.5" />Google 인증됨</span>
      </div>
      <div>
        <label htmlFor="linked-google-email" className="mb-1.5 block text-xs font-semibold text-[#334155]">연동된 구글 이메일</label>
        <div className="flex min-h-10 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3">
          <img src={google} alt="" className="size-3 shrink-0" />
          <input id="linked-google-email" value={email} readOnly className="min-w-0 flex-1 bg-transparent py-2.5 text-xs text-[#334155] outline-offset-2" />
          <span className="shrink-0 text-[11px] text-[#94a3b8]">수정 불가</span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-[#94a3b8]">소셜 계정 변경은 하단 계정 연동 메뉴에서 가능합니다.</p>
      </div>
      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
          <label htmlFor="edit-nickname" className="text-xs font-semibold text-[#334155]">닉네임</label>
          <span aria-live="polite" className="text-[11px] text-[#047857]">{isNicknameValid ? '✓ 사용 가능한 닉네임' : ''}</span>
        </div>
        <div className={`flex min-h-10 items-center gap-2 rounded-xl border bg-white px-3 focus-within:ring-1 ${isNicknameValid ? 'border-[#10b981] focus-within:ring-[#10b981]' : 'border-red-300 focus-within:ring-red-300'}`}>
          <input id="edit-nickname" value={nickname} onChange={(event) => onNicknameChange(event.target.value)} aria-invalid={!isNicknameValid} aria-describedby="edit-nickname-help" className="min-w-0 flex-1 bg-transparent py-2.5 text-xs text-[#1e293b] outline-none" />
          <button type="button" aria-label="닉네임 지우기" onClick={() => onNicknameChange('')} className="flex size-7 shrink-0 items-center justify-center rounded-full"><img src={close} alt="" className="size-2.5" /></button>
        </div>
        <p id="edit-nickname-help" className={`mt-1 text-[11px] leading-4 ${isNicknameValid ? 'text-[#94a3b8]' : 'text-red-600'}`}>{isNicknameValid ? '한글, 영문, 숫자 2~12자까지 지정할 수 있습니다.' : '2~12자의 한글, 영문, 숫자로 입력해주세요.'}</p>
      </div>
      <div>
        <label htmlFor="edit-real-name" className="mb-1.5 block text-xs font-semibold text-[#334155]">이름 (실명)</label>
        <input id="edit-real-name" value={realName} onChange={(event) => onRealNameChange(event.target.value)} aria-invalid={!realName.trim()} className="min-h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs text-[#1e293b] shadow-xs outline-offset-2 focus:outline-[#047857]" />
      </div>
    </section>
  )
}
