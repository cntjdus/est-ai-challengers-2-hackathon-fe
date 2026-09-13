import shieldIcon from '../../assets/icons/consent-shield.svg'
import profileIcon from '../../assets/icons/consent-profile.svg'
import emailIcon from '../../assets/icons/consent-email.svg'
import lockIcon from '../../assets/icons/consent-lock.svg'

const permissions = [
  { title: '기본 프로필 정보', icon: profileIcon, description: '이름 및 프로필 사진을 활용하여 맞춤형 식단 대시보드를 구성합니다.' },
  { title: '이메일 주소', icon: emailIcon, description: '계정 식별 및 냉장고 식재료 유통기한 데이터 클라우드 동기화용' },
]

export default function PermissionScopeCard() {
  return (
    <section aria-labelledby="permission-heading" className="flex flex-col gap-3 rounded-2xl border border-[#f3f4f6] bg-white p-[17px] shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-[#f3f4f6] pb-[9px]">
        <h2 id="permission-heading" className="flex items-center gap-1.5 text-xs leading-4 font-bold text-[#374151]">
          <img src={shieldIcon} alt="" className="h-[15px] w-3" />연동되는 필수 항목
        </h2>
        <span className="shrink-0 text-[11px] text-[#9ca3af]">총 2개 권한</span>
      </div>
      {permissions.map(({ title, icon, description }) => (
        <div key={title} className="flex items-start gap-3 rounded-xl border border-[#f3f4f6]/80 bg-[#f8fafd] p-[11px]">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#d1fae5]/60">
            <img src={icon} alt="" className="h-[14px] w-[17px] object-contain" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <h3 className="text-xs leading-4 font-bold text-[#1f2937]">{title}</h3>
              <span className="text-[10px] font-semibold text-[#059669]">필수</span>
            </div>
            <p className="break-keep text-[11px] leading-[15.13px] text-[#6b7280]">{description}</p>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-[#f3f4f6] pt-[15px]">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5]">
          <img src={lockIcon} alt="" className="h-[11.375px] w-[8.667px]" />
        </span>
        <p className="text-[11px] leading-[13.75px] text-[#6b7280]">개인정보는 <strong>256-bit SSL 암호화</strong>로 안전하게 보호되며, 동의 없이 외부에 공유되지 않습니다.</p>
      </div>
    </section>
  )
}
