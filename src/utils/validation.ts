import { CATEGORIES, type Category } from '../types/expense'

export interface ExpenseInput {
  title: string
  description: string
  amount: string | number
  date: string
  category: string
}

export interface FieldErrors {
  title?: string
  description?: string
  amount?: string
  date?: string
  category?: string
}

export function validateExpense(input: ExpenseInput): FieldErrors {
  const errors: FieldErrors = {}
  const title = input.title.trim()
  if (!title) errors.title = 'Please add a short title.'
  else if (title.length > 80) errors.title = 'Keep the title under 80 characters.'

  let amount: number
  if (typeof input.amount === 'number') {
    amount = input.amount
  } else {
    const raw = String(input.amount).trim()
    if (raw.includes('-')) {
      amount = -1
    } else {
      amount = Number(raw.replace(/[^\d.]/g, ''))
    }
  }
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount greater than zero.'
  else if (amount > 99_99_99_999) errors.amount = 'That amount looks too large.'

  if (!input.date || Number.isNaN(Date.parse(input.date))) errors.date = 'Choose a valid date.'

  if (!CATEGORIES.includes(input.category as Category)) errors.category = 'Pick a category.'

  if (input.description && input.description.length > 240) {
    errors.description = 'Keep the description under 240 characters.'
  }

  return errors
}

export function isCategory(value: string): value is Category {
  return CATEGORIES.includes(value as Category)
}

export function sanitizeText(value: string, max = 240): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}
