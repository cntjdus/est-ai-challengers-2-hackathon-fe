import googleLogo from '../../assets/google-logo.svg'

export default function GoogleLoginCard({ onGoogleLogin, onTerms, onPrivacy }) {
  return (
    <section aria-label="Google 로그인" className="mx-5 rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col items-center gap-4 py-2">
        <button type="button" onClick={onGoogleLogin} className="flex min-h-14 w-full items-center justify-center gap-2 min-[360px]:gap-3 rounded-2xl border border-[#bbcabf]/60 bg-white px-2 py-2 text-[14px] min-[360px]:text-base leading-5 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#f8f9fa]">
          <img src={googleLogo} alt="" className="size-5 shrink-0" />
          <span>Google 계정으로 계속하기</span>
        </button>
        <div className="w-full pt-1 text-center text-[11px] leading-[17.88px] tracking-[0.22px] text-[#6c7a71]">
          <p>Google 계정으로 간편하고 안전하게 로그인하세요</p>
          <p className="mt-[3.375px] text-[#6c7a71]/80">
            로그인 시 <button type="button" onClick={onTerms} className="underline underline-offset-2">서비스 이용약관</button> 및{' '}
            <button type="button" onClick={onPrivacy} className="underline underline-offset-2">개인정보 처리방침</button>에 동의하게 됩니다
          </p>
        </div>
      </div>
    </section>
  )
}
