import { ORDER_STEPS, OrderStatus, stepIndex } from '@/lib/orders'
import { CheckIcon } from '@/components/Icons'

export default function OrderStepper({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
        <p className="text-red-700 text-sm font-medium">Affären är avbruten</p>
      </div>
    )
  }
  const current = stepIndex(status)
  return (
    <ol className="relative">
      {ORDER_STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={step.key} className="flex gap-4 pb-6 last:pb-0 relative">
            {i < ORDER_STEPS.length - 1 && (
              <span
                className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${
                  done ? 'bg-emerald-400' : 'bg-espresso-100'
                }`}
              />
            )}
            <span
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                done
                  ? 'bg-emerald-500 text-white'
                  : active
                  ? 'bg-gold-sheen text-espresso-900 shadow-gold ring-4 ring-gold-100'
                  : 'bg-espresso-100 text-espresso-400'
              }`}
            >
              {done ? <CheckIcon size={15} strokeWidth={3} /> : i + 1}
            </span>
            <div className={`pt-1 ${active ? '' : done ? 'opacity-90' : 'opacity-50'}`}>
              <p className={`text-sm font-medium ${active ? 'text-gold-700' : 'text-espresso-800'}`}>
                {step.label}
                {active && <span className="ml-2 chip bg-gold-50 text-gold-700 !py-0.5">Pågår</span>}
              </p>
              <p className="text-xs text-espresso-400 mt-0.5">{step.desc}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
