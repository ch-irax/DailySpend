import * as XLSX from 'xlsx'
import type { Category, Expense } from '../types/expense'
import { isCategory, sanitizeText } from '../utils/validation'
import { todayISO, toISODate } from '../utils/date'
import { createId } from '../utils/id'

export interface ParsedImportRow {
  title: string
  amount: number
  category: Category
  date: string
  description: string
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z]/g, '')
}

function parseDateValue(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toISODate(value)
  }
  if (typeof value === 'number') {
    // Excel serial date fallback if cellDates wasn't applied
    const parsed = new Date((value - (25567 + 2)) * 86400 * 1000)
    if (!Number.isNaN(parsed.getTime())) return toISODate(parsed)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) return toISODate(parsed)
  }
  return todayISO()
}

export function parseImportFile(buffer: ArrayBuffer): ParsedImportRow[] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const firstSheetName = wb.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = wb.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  const items: ParsedImportRow[] = []

  for (const raw of rawRows) {
    const normalized: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(raw)) {
      normalized[normalizeKey(k)] = v
    }

    const titleRaw = normalized['title'] ?? normalized['item'] ?? normalized['expense'] ?? normalized['name']
    const amountRaw = normalized['amount'] ?? normalized['cost'] ?? normalized['price']
    const categoryRaw = normalized['category']
    const dateRaw = normalized['date']
    const descRaw = normalized['description'] ?? normalized['desc'] ?? normalized['note'] ?? normalized['notes']

    const title = sanitizeText(String(titleRaw ?? ''), 80)
    const amount = typeof amountRaw === 'number' ? amountRaw : Number(String(amountRaw ?? '').replace(/[^\d.]/g, ''))
    if (!title || !Number.isFinite(amount) || amount <= 0) continue

    const catStr = String(categoryRaw ?? '').trim()
    const category: Category = isCategory(catStr) ? catStr : 'Other'
    const date = parseDateValue(dateRaw)
    const description = sanitizeText(String(descRaw ?? ''), 240)

    items.push({
      title,
      amount: Math.round(amount * 100) / 100,
      category,
      date,
      description,
    })
  }

  return items
}

export function toExpenseRecords(rows: ParsedImportRow[]): Expense[] {
  const now = new Date().toISOString()
  return rows.map((row) => ({
    id: createId(),
    title: row.title,
    description: row.description,
    amount: row.amount,
    category: row.category,
    date: row.date,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'synced',
    conflictCloud: null,
  }))
}
