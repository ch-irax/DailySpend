import type { CurrencyCode } from '../types/expense'

const SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
}

const LOCALES: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
}

export function currencySymbol(code: CurrencyCode): string {
  return SYMBOLS[code]
}

export function formatMoney(amount: number, currency: CurrencyCode = 'INR'): string {
  const safe = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat(LOCALES[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(safe)
}

export function formatCompact(amount: number, currency: CurrencyCode = 'INR'): string {
  const symbol = SYMBOLS[currency]
  if (Math.abs(amount) >= 100000) {
    return `${symbol}${(amount / 100000).toFixed(1)}L`
  }
  if (Math.abs(amount) >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`
  }
  return formatMoney(amount, currency)
}

export function parseAmount(value: string): number | null {
  if (value.includes('-')) return null
  const cleaned = value.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}
