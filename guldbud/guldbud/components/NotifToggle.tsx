'use client'

export default function NotifToggle({
  on,
  onToggle,
}: {
  on: boolean
  onToggle: (v: boolean) => void | Promise<void>
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onToggle(!on)}
      className={`relative w-12 h-7 rounded-full transition shrink-0 ${on ? 'bg-emerald-500' : 'bg-espresso-200'}`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}
