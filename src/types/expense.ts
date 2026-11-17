export const CATEGORIES = [
  'Food & Drinks',
  'Travel',
  'Shopping',
  'Bills & Utilities',
  'Education',
  'Health',
  'Entertainment',
  'Personal',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'failed'

export interface Expense {
  id: string
  title: string
  description: string
  amount: number
  category: Category
  date: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
  conflictCloud?: CloudExpense | null
}

export interface CloudExpense {
  id: string
  title: string
  description: string
  amount: number
  category: Category
  date: string
  createdAt: string
  updatedAt: string
}

export type QueueOp = 'create' | 'update' | 'delete'

export interface SyncQueueItem {
  id: string
  expenseId: string
  op: QueueOp
  payload: Expense
  attempts: number
  lastError?: string
  createdAt: string
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'
export type ThemeName = 'warm' | 'blush'

export interface AppSettings {
  currency: CurrencyCode
  theme: ThemeName
  lastSyncAt: string | null
  spreadsheetId: string | null
  spreadsheetName: string | null
}

export type ConnectionStatus = 'disconnected' | 'connected' | 'expired'

export interface GoogleAccount {
  email: string
  name: string
  picture: string | null
  spreadsheetId: string | null
  spreadsheetName: string | null
  configured: boolean
}

export type NetworkSyncLabel = 'Synced' | 'Syncing' | 'Offline' | 'Sync failed' | 'Local'
