import person from '../../assets/icons/household-person.svg'
import close from '../../assets/icons/preference-tag-close.svg'

const householdOptions = [{ value: 'single', label: '1인 가구' }]
const frequencies = [
  { value: '0', label: '0회', description: '주 0회 간편 모드' },
  { value: '1-2', label: '1~2회', description: '주 1~2회 가벼운 모드' },
  { value: '3-4', label: '3~4회', description: '주 3~4회 알뜰 모드' },
  { value: '5+', label: '5회 이상', description: '주 5회 이상 집밥 모드' },
]
const optionClass = 'rounded-xl border border-[#e2e8f0] bg-white py-[9px] text-xs leading-4 text-[#475569] aria-pressed:border-[#059669] aria-pressed:bg-[#f0fdf4] aria-pressed:font-bold aria-pressed:text-[#047857] aria-pressed:shadow-xs'

export default function DietaryPreferencesSection({ householdType, onHouseholdChange, cookingFrequency, onFrequencyChange, dietStyles, onRemoveStyle, dietKeyword, onKeywordChange, onKeywordKeyDown, onAddKeyword, showAddButton = false }) {
  return (
    <section aria-labelledby="dietary-heading" className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0]/80 bg-white p-[17px] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#f1f5f9] pb-[11px] text-[#94a3b8]">
        <h2 id="dietary-heading" className="text-xs leading-4 tracking-[0.6px]">가구 및 식생활 환경</h2>
        <span className="text-[11px]">맞춤 식단 추천 기준</span>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-[#334155]">가구 구성</legend>
        <div className="flex flex-wrap gap-2">
          {householdOptions.map(({ value, label }) => <button key={value} type="button" aria-pressed={householdType === value} onClick={() => onHouseholdChange(value)} className={optionClass + ' flex items-center gap-1.5 px-6 py-[11px]'}><img src={person} alt="" className="h-3 w-[10.5px]" />{label}</button>)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 w-full">
          <span className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-xs font-semibold text-[#334155]">주간 직접 요리 횟수</span>
            <span aria-live="polite" className="text-[11px] text-[#047857]">{frequencies.find((item) => item.value === cookingFrequency)?.description}</span>
          </span>
        </legend>
        <div className="grid grid-cols-4 gap-2">{frequencies.map(({ value, label }) => <button key={value} type="button" aria-pressed={cookingFrequency === value} onClick={() => onFrequencyChange(value)} className={optionClass + ' min-w-0 px-0.5'}>{label}</button>)}</div>
      </fieldset>
      <div>
        <h3 className="mb-2 text-xs font-semibold text-[#334155]">선호 식단 스타일</h3>
        <div className="flex flex-wrap gap-2">
          {dietStyles.map((style) => <span key={style} className="flex max-w-full items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-[11px] py-1.5 text-xs leading-4 text-[#065f46]"><span className="min-w-0 break-all">#{style}</span><button type="button" aria-label={style + ' 삭제'} onClick={() => onRemoveStyle(style)} className="flex size-4 shrink-0 items-center justify-center rounded-full"><img src={close} alt="" className="size-[6.25px]" /></button></span>)}
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2"><input aria-label="선호 식단 키워드" value={dietKeyword} onChange={(event) => onKeywordChange(event.target.value)} onKeyDown={onKeywordKeyDown} enterKeyHint="done" placeholder="# 선호 식단 키워드 입력 (예 : 양식, 매운음식)" className="min-h-10 w-full min-w-0 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-xs shadow-xs outline-offset-2 focus:outline-[#059669]" />{showAddButton && <button type="button" onClick={onAddKeyword} className="shrink-0 rounded-lg bg-[#ecfdf5] px-2 py-2.5 text-xs text-[#047857]">+ 추가</button>}</div>
    </section>
  )
}
