import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useExpenses } from '../hooks/useExpenses'
import { formatMoney } from '../utils/currency'
import { CHART_COLORS } from '../utils/categories'
import { Card } from '../components/UI/Card'
import { startOfMonthISO, toISODate } from '../utils/date'
import { CATEGORIES } from '../types/expense'

export function AnalyticsPage() {
  const { expenses, stats, settings } = useExpenses()
  const monthStart = startOfMonthISO()
  const monthItems = expenses.filter((item) => item.date >= monthStart)

  const daily = useMemo(() => {
    const map = new Map<string, number>()
    const cursor = new Date()
    cursor.setDate(cursor.getDate() - 13)
    for (let i = 0; i < 14; i += 1) {
      map.set(toISODate(cursor), 0)
      cursor.setDate(cursor.getDate() + 1)
    }
    for (const item of monthItems) {
      if (map.has(item.date)) map.set(item.date, (map.get(item.date) ?? 0) + item.amount)
    }
    return [...map.entries()].map(([date, total]) => ({
      name: date.slice(8),
      total,
    }))
  }, [monthItems])

  const categories = CATEGORIES.map((category, index) => ({
    name: category,
    value: stats.byCategory[category] ?? 0,
    color: CHART_COLORS[index],
  })).filter((row) => row.value > 0)

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-taupe">A gentle look at this month.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="This month" value={formatMoney(stats.monthTotal, settings.currency)} />
        <Stat label="Transactions" value={String(stats.monthCount)} />
      </div>

      <Card>
        <p className="text-sm font-medium">Highest category</p>
        <p className="font-display mt-2 text-xl font-semibold">
          {stats.topCategory
            ? `${stats.topCategory.category} · ${formatMoney(stats.topCategory.amount, settings.currency)}`
            : 'Nothing yet'}
        </p>
      </Card>

      <Card>
        <p className="mb-4 text-sm font-medium">Daily spending</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <XAxis dataKey="name" tick={{ fill: '#9B8B83', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: '#FCE8E8' }}
                contentStyle={{ borderRadius: 16, borderColor: '#F0E7E2' }}
                formatter={(value) => formatMoney(Number(value), settings.currency)}
              />
              <Bar dataKey="total" fill="#D98C91" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <p className="mb-4 text-sm font-medium">Category-wise expenditure</p>
        {categories.length === 0 ? (
          <p className="text-sm text-taupe">Add a few expenses to see this chart.</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-48 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                    {categories.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value), settings.currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {categories.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-coffee">
                    <span className="size-2.5 rounded-full" style={{ background: row.color }} />
                    {row.name}
                  </span>
                  <span className="font-medium text-ink">{formatMoney(row.value, settings.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs text-taupe">{label}</p>
      <p className="font-display mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}
