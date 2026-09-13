export default function LoginHelpFooter({ onContact }) {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 px-5 pt-6 text-center text-[13px] leading-[18px] tracking-[0.13px]">
      <p className="text-[#6c7a71]">로그인에 문제가 있으신가요?</p>
      <button type="button" onClick={onContact} className="text-[#006c49]">고객센터 문의</button>
    </footer>
  )
}
