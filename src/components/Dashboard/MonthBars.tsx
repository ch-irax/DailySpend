import { useMemo } from 'react'
import type { Expense } from '../../types/expense'
import { endOfMonthISO, parseISODate, startOfMonthISO, toISODate } from '../../utils/date'

export function MonthBars({ expenses }: { expenses: Expense[] }) {
  const days = useMemo(() => {
    const start = startOfMonthISO()
    const end = endOfMonthISO()
    const map = new Map<string, number>()
    const cursor = parseISODate(start)
    const last = parseISODate(end)
    while (cursor <= last) {
      map.set(toISODate(cursor), 0)
      cursor.setDate(cursor.getDate() + 1)
    }
    for (const item of expenses) {
      if (item.date >= start && item.date <= end) {
        map.set(item.date, (map.get(item.date) ?? 0) + item.amount)
      }
    }
    const values = [...map.values()]
    const max = Math.max(1, ...values)
    return [...map.entries()].map(([date, total]) => ({ date, total, h: (total / max) * 100 }))
  }, [expenses])

  return (
    <div>
      <p className="text-sm font-medium text-ink">Monthly overview</p>
      <div className="mt-4 flex h-24 items-end gap-[3px]">
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.total}`}
            className="flex-1 rounded-full bg-blush"
            style={{ height: `${Math.max(8, day.h)}%`, background: day.total ? '#D98C91' : '#FCE8E8' }}
          />
        ))}
      </div>
    </div>
  )
}
