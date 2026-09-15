export default function AgreementCard({ checked, onChange, notificationConsent, onNotificationChange, onRequiredTerms, onOptionalTerms }) {
  return <section aria-label="서비스 이용 약관" className="space-y-4 rounded-2xl bg-white p-4 text-xs text-[#475569]">
    <div className="flex items-start justify-between gap-2">
      <label className="flex items-start gap-2 leading-5"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 size-4 accent-[#047857]" />[필수] 서비스 이용약관 및 개인정보 처리방침 확인·동의</label>
      <button type="button" onClick={onRequiredTerms} className="shrink-0 py-1 text-[#047857] underline">안내</button>
    </div>
    <div className="flex items-start justify-between gap-2">
      <label className="flex items-start gap-2 leading-5"><input type="checkbox" checked={notificationConsent} onChange={(event) => onNotificationChange(event.target.checked)} className="mt-0.5 size-4 accent-[#047857]" />[선택] 소비기한 및 소진 추천 알림</label>
      <button type="button" onClick={onOptionalTerms} className="shrink-0 py-1 text-[#047857] underline">안내</button>
    </div>
    <p className="text-[11px] text-[#94a3b8]">선택 알림에 동의하지 않아도 서비스를 이용할 수 있어요.</p>
  </section>
}
