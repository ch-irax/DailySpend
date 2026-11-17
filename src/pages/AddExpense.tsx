import { useNavigate, useParams } from 'react-router-dom'
import { ExpenseForm } from '../components/Expense/ExpenseForm'
import { useApp } from '../context/AppContext'
import { Button } from '../components/UI/Button'
import { formatMoney } from '../utils/currency'

export function AddExpensePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { expenses, resolveExpenseConflict, settings, toast } = useApp()
  const initial = id ? expenses.find((item) => item.id === id) : undefined

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-ink">
        {initial ? 'Edit expense' : 'Add expense'}
      </h1>
      <p className="mt-1 mb-6 text-sm text-taupe">A few details. That’s all it takes.</p>
      {initial?.syncStatus === 'conflict' && initial.conflictCloud ? (
        <div className="mb-6 rounded-[24px] border border-line bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="font-medium text-ink">This record differs from Google Sheets.</p>
          <p className="mt-2 text-sm text-coffee">
            Sheet copy: {initial.conflictCloud.title} ·{' '}
            {formatMoney(initial.conflictCloud.amount, settings.currency)} · {initial.conflictCloud.date}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="soft"
              onClick={async () => {
                await resolveExpenseConflict(initial.id, 'local')
                toast('Keeping your device copy.')
              }}
            >
              Keep this device’s version
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await resolveExpenseConflict(initial.id, 'cloud')
                toast('Using the Google Sheets copy.', 'info')
                navigate('/')
              }}
            >
              Use the Google Sheets version
            </Button>
          </div>
        </div>
      ) : null}
      <ExpenseForm
        initial={initial}
        onCancel={() => navigate(-1)}
        onSaved={() => navigate('/')}
      />
    </div>
  )
}
