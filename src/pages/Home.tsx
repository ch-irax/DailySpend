import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { LiquidMetalButton } from '@/components/ui/liquid-metal'
import { useExpenses } from '../hooks/useExpenses'
import { greeting } from '../utils/date'
import { SummaryCard } from '../components/Dashboard/SummaryCard'
import { MonthBars } from '../components/Dashboard/MonthBars'
import { ExpenseCard } from '../components/Expense/ExpenseCard'
import { EmptyState } from '../components/UI/EmptyState'
import { SyncBadge } from '../components/Navigation/SyncBadge'
import { Card } from '../components/UI/Card'

export function HomePage() {
  const navigate = useNavigate()
  const { expenses, stats, settings, conflictCount } = useExpenses()
  const recent = expenses.slice(0, 5)

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="font-display text-2xl font-semibold text-ink">{greeting()}</p>
          <p className="mt-1 text-sm text-taupe">Here's where your money went.</p>
        </div>
        <SyncBadge />
      </header>

      {conflictCount ? (
        <button
          type="button"
          onClick={() => navigate('/expenses')}
          className="w-full rounded-[22px] border border-line bg-white px-4 py-3 text-left text-sm text-coffee shadow-[var(--shadow-card)]"
        >
          {conflictCount} expense{conflictCount === 1 ? '' : 's'} need a choice before they can sync.
        </button>
      ) : null}

      <SummaryCard
        todayTotal={stats.todayTotal}
        monthTotal={stats.monthTotal}
        count={stats.count}
        currency={settings.currency}
      />

      <LiquidMetalButton
        fullWidth
        size="lg"
        icon={<ArrowRight className="w-5 h-5" />}
        metalConfig={{
          colorBack: '#3b82f6',
          colorTint: '#93c5fd',
        }}
        onClick={() => navigate('/add')}
      >
        Add Expense
      </LiquidMetalButton>

      {expenses.length === 0 ? (
        <EmptyState onAdd={() => navigate('/add')} />
      ) : (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Recent Expenses</h2>
              <button type="button" className="text-sm text-coffee" onClick={() => navigate('/expenses')}>
                See all
              </button>
            </div>
            <div className="space-y-3">
              {recent.map((expense, index) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  currency={settings.currency}
                  delay={index * 0.05}
                  onClick={() => navigate(`/expenses/${expense.id}`)}
                />
              ))}
            </div>
          </section>
          <Card>
            <MonthBars expenses={expenses} />
          </Card>
        </>
      )}
    </div>
  )
}
