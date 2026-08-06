// Centralised, lightweight line-icon set. Replaces emoji across the app for a
// more serious, cohesive look. All icons inherit currentColor and take an
// optional size + className.

type P = { size?: number; className?: string; strokeWidth?: number }

const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
})

const s = (w = 1.7) => ({
  stroke: 'currentColor',
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

/* ---------------- Feature / UI ---------------- */
export const CameraIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" {...s(strokeWidth)} />
    <circle cx="12" cy="13" r="3.2" {...s(strokeWidth)} />
  </svg>
)

export const ScaleIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v18M7 21h10M4 7h16M4 7l-2.5 5a3 3 0 0 0 5 0L4 7zM20 7l-2.5 5a3 3 0 0 0 5 0L20 7z" {...s(strokeWidth)} />
  </svg>
)

export const CoinsIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <ellipse cx="9" cy="7" rx="6" ry="3" {...s(strokeWidth)} />
    <path d="M3 7v5c0 1.66 2.7 3 6 3s6-1.34 6-3V7" {...s(strokeWidth)} />
    <path d="M9 15v2c0 1.66 2.7 3 6 3s6-1.34 6-3v-5c0-1.3-1.66-2.4-4-2.83" {...s(strokeWidth)} />
  </svg>
)

export const FlameIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3s5 3.5 5 8.5a5 5 0 0 1-10 0c0-1.6.6-2.8 1.3-3.6.3 1 1 1.8 1.9 2C10.8 8.5 10 6 12 3z" {...s(strokeWidth)} />
  </svg>
)

export const SparkleIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l1.6 5L19 9.5 13.6 11 12 16l-1.6-5L5 9.5 10.4 8 12 3z" fill="currentColor" />
    <path d="M18.5 14l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z" fill="currentColor" opacity="0.7" />
  </svg>
)

export const BellIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...s(strokeWidth)} />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" {...s(strokeWidth)} />
  </svg>
)

export const ShieldIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" {...s(strokeWidth)} />
    <path d="M9 12l2 2 4-4" {...s(strokeWidth)} />
  </svg>
)

export const BoltIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...s(strokeWidth)} />
  </svg>
)

export const HeartIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 21s-7-4.4-9.5-8.5C1 9.5 2.5 6 6 6c2 0 3.2 1.2 4 2.3C10.8 7.2 12 6 14 6c3.5 0 5 3.5 3.5 6.5C19 16.6 12 21 12 21z" {...s(strokeWidth)} />
  </svg>
)

export const StarIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className} fill="currentColor">
    <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
  </svg>
)

export const CheckIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 13l4 4L19 7" {...s(strokeWidth || 2.4)} />
  </svg>
)

export const ArrowRightIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" {...s(strokeWidth || 2)} />
  </svg>
)

export const ClockIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" {...s(strokeWidth)} />
    <path d="M12 7v5l3 2" {...s(strokeWidth)} />
  </svg>
)

export const LockIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2" {...s(strokeWidth)} />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" {...s(strokeWidth)} />
  </svg>
)

export const TruckIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" {...s(strokeWidth)} />
    <circle cx="7" cy="18" r="1.6" {...s(strokeWidth)} />
    <circle cx="17.5" cy="18" r="1.6" {...s(strokeWidth)} />
  </svg>
)

export const WalletIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h16a1 1 0 0 1 1 1v3" {...s(strokeWidth)} />
    <circle cx="16.5" cy="12.5" r="1.3" fill="currentColor" />
  </svg>
)

export const MailIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" {...s(strokeWidth)} />
    <path d="M4 7l8 6 8-6" {...s(strokeWidth)} />
  </svg>
)

export const HourglassIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 3h10M7 21h10M8 3c0 4 8 5 8 9s-8 5-8 9M16 3c0 4-8 5-8 9s8 5 8 9" {...s(strokeWidth)} />
  </svg>
)

export const HomeIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 11l8-6 8 6M6 10v9h12v-9" {...s(strokeWidth)} />
    <path d="M10 19v-5h4v5" {...s(strokeWidth)} />
  </svg>
)

export const StoreIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9l1-4h14l1 4M4 9v10h16V9M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 6 0 2.5 2.5 0 0 0 5 0" {...s(strokeWidth)} />
  </svg>
)

/* ---------------- Gem / diamond ---------------- */
export const GemIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 4h12l3 5-9 11L3 9l3-5z" {...s(strokeWidth)} />
    <path d="M3 9h18M8 4l-2 5 6 11 6-11-2-5M9.5 9L12 20M14.5 9L12 20" {...s(strokeWidth)} />
  </svg>
)

/* ---------------- Category icons ---------------- */
export const RingIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M8.5 6.5L12 3l3.5 3.5L12 10 8.5 6.5z" {...s(strokeWidth)} />
    <circle cx="12" cy="16" r="5" {...s(strokeWidth)} />
  </svg>
)
export const NecklaceIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 4c0 6 3 9 7 9s7-3 7-9" {...s(strokeWidth)} />
    <path d="M12 13v3" {...s(strokeWidth)} />
    <path d="M12 16l2 3h-4l2-3z" {...s(strokeWidth)} />
  </svg>
)
export const EarringIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 4c-1.5 0-2.5 1.2-2.5 2.8 0 2 2.5 2.2 2.5 4.2" {...s(strokeWidth)} />
    <circle cx="9" cy="15" r="3.2" {...s(strokeWidth)} />
    <path d="M15.5 6l3 12" {...s(strokeWidth)} />
  </svg>
)
export const PendantIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 5c3 0 5 2 8 2s5-2 8-2" {...s(strokeWidth)} />
    <path d="M12 8v3" {...s(strokeWidth)} />
    <path d="M12 11l3 4-3 5-3-5 3-4z" {...s(strokeWidth)} />
  </svg>
)
export const BraceletIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <ellipse cx="12" cy="12" rx="8" ry="5.5" {...s(strokeWidth)} />
    <path d="M9 8.5l1.5-2h3L15 8.5" {...s(strokeWidth)} />
  </svg>
)
export const BroochIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="4" {...s(strokeWidth)} />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" {...s(strokeWidth)} />
  </svg>
)
export const CoinIcon = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" {...s(strokeWidth)} />
    <circle cx="12" cy="12" r="5" {...s(strokeWidth)} />
  </svg>
)
