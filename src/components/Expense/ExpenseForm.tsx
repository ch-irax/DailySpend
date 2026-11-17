import { useState } from 'react'
import { motion } from 'motion/react'
import { CATEGORIES } from '../../types/expense'
import type { Category, Expense } from '../../types/expense'
import { CATEGORY_META } from '../../utils/categories'
import { todayISO } from '../../utils/date'
import { parseAmount } from '../../utils/currency'
import { validateExpense, type FieldErrors } from '../../utils/validation'
import { Button } from '../UI/Button'
import { useApp } from '../../context/AppContext'

export function ExpenseForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Expense
  onCancel: () => void
  onSaved: () => void
}) {
  const { saveExpense, toast, settings } = useApp()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [category, setCategory] = useState<Category | ''>(initial?.category ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = validateExpense({ title, description, amount, date, category })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const parsed = parseAmount(amount)
    if (parsed === null || !category) return
    setSaving(true)
    try {
      await saveExpense({
        id: initial?.id,
        title,
        description,
        amount: parsed,
        category,
        date,
      })
      toast(initial ? 'Expense updated.' : 'Expense saved.')
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Expense title" required error={errors.title}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Coffee with a friend"
          autoComplete="off"
          className="field"
        />
      </Field>
      <Field label="Short description" error={errors.description}>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note"
          autoComplete="off"
          className="field"
        />
      </Field>
      <Field label={`Amount (${settings.currency})`} required error={errors.amount}>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          className="field"
        />
      </Field>
      <Field label="Date" required error={errors.date}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
      </Field>
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink">
          Category <span className="text-rose">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((item) => {
            const meta = CATEGORY_META[item]
            const Icon = meta.icon
            const active = category === item
            return (
              <motion.button
                type="button"
                key={item}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCategory(item)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm ${
                  active ? 'bg-rose text-white' : `${meta.chip}`
                }`}
              >
                <Icon className="size-4" />
                {item}
              </motion.button>
            )
          })}
        </div>
        {errors.category ? <p className="mt-2 text-sm text-rose">{errors.category}</p> : null}
      </fieldset>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? 'Saving…' : 'Save Expense'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">
        {label} {required ? <span className="text-rose">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-2 block text-sm text-rose">{error}</span> : null}
    </label>
  )
}
