'use client'
import { useState } from 'react'

export default function NotifToggle({
  on,
  onToggle,
}: {
  on: boolean
  onToggle: (v: boolean) => void | Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const handle = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onToggle(!on)
    } finally {
      setBusy(false)
    }
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={handle}
      disabled={busy}
      className={`relative w-12 h-7 rounded-full transition shrink-0 ${busy ? 'opacity-60' : ''} ${on ? 'bg-emerald-500' : 'bg-espresso-200'}`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}
