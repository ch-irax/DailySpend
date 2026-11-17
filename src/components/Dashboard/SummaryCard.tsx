import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { formatMoney } from '../../utils/currency'
import type { CurrencyCode } from '../../types/expense'
import { monthLabel } from '../../utils/date'

export function SummaryCard({
  todayTotal,
  monthTotal,
  count,
  currency,
}: {
  todayTotal: number
  monthTotal: number
  count: number
  currency: CurrencyCode
}) {
  return (
    <section className="overflow-hidden rounded-[28px] bg-linear-to-br from-blush to-[#f7d7d7] p-6 text-ink shadow-[var(--shadow-soft)]">
      <p className="text-sm text-coffee">{monthLabel()}</p>
      <p className="font-display mt-3 text-4xl font-bold tracking-tight">
        <Count amount={monthTotal} currency={currency} />
      </p>
      <p className="mt-1 text-sm text-coffee">This month</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/70 px-4 py-3">
          <p className="text-xs text-taupe">Today</p>
          <p className="mt-1 font-display text-lg font-semibold">
            <Count amount={todayTotal} currency={currency} />
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-3">
          <p className="text-xs text-taupe">Transactions</p>
          <p className="mt-1 font-display text-lg font-semibold">{count}</p>
        </div>
      </div>
    </section>
  )
}

function Count({ amount, currency }: { amount: number; currency: CurrencyCode }) {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? amount : 0)
  useEffect(() => {
    if (reduce) {
      setValue(amount)
      return
    }
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700)
      const eased = 1 - (1 - t) ** 3
      setValue(from + (amount - from) * eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [amount, reduce])
  return <>{formatMoney(value, currency)}</>
}
