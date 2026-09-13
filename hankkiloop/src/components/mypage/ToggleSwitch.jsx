export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="flex min-h-11 w-12 shrink-0 items-center justify-center rounded-full">
      <span className={`flex h-6 w-12 items-center rounded-full p-0.5 transition-colors motion-reduce:transition-none ${checked ? 'bg-[#10b981]' : 'bg-[#cbd5e1]'}`}>
        <span className={`size-5 rounded-full bg-white shadow-xs transition-transform motion-reduce:transition-none ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}
