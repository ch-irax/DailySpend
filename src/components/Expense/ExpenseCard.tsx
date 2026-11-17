import { motion, useReducedMotion } from 'motion/react'
import type { Expense } from '../../types/expense'
import { CATEGORY_META } from '../../utils/categories'
import { formatMoney } from '../../utils/currency'
import { formatShortDate } from '../../utils/date'
import type { CurrencyCode } from '../../types/expense'

export function ExpenseCard({
  expense,
  currency,
  delay = 0,
  onClick,
}: {
  expense: Expense
  currency: CurrencyCode
  delay?: number
  onClick?: () => void
}) {
  const meta = CATEGORY_META[expense.category]
  const Icon = meta.icon
  const reduce = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay }}
      className="flex w-full min-h-[76px] items-center gap-3 rounded-[22px] border border-line bg-white px-4 py-3 text-left shadow-[var(--shadow-card)]"
    >
      <span className={`flex size-11 items-center justify-center rounded-2xl ${meta.tint} text-coffee`}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{expense.title}</span>
        <span className="mt-0.5 block truncate text-xs text-taupe">
          {expense.description || expense.category} · {formatShortDate(expense.date)}
          {expense.syncStatus === 'pending' ? ' · waiting to sync' : ''}
          {expense.syncStatus === 'conflict' ? ' · needs a choice' : ''}
          {expense.syncStatus === 'failed' ? ' · sync failed' : ''}
        </span>
      </span>
      <span className="font-display text-[15px] font-semibold text-ink">
        {formatMoney(expense.amount, currency)}
      </span>
    </motion.button>
  )
}
