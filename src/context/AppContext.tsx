import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppSettings,
  Expense,
  GoogleAccount,
  NetworkSyncLabel,
  QueueOp,
} from '../types/expense'
import {
  clearExpenses,
  getAllExpenses,
  getQueue,
  getSettings,
  putExpense,
  putExpenses,
  putQueueItem,
  removeQueueForExpense,
  saveSettings,
} from '../database/indexedDB'
import { createId } from '../utils/id'
import { sanitizeText } from '../utils/validation'
import { fetchGoogleStatus } from '../services/googleAuth'
import { resolveConflict, runSync } from '../services/syncService'
import { toExpenseRecords, type ParsedImportRow } from '../services/importService'

interface Toast {
  id: string
  message: string
  tone: 'success' | 'info' | 'error'
}

interface AppContextValue {
  ready: boolean
  expenses: Expense[]
  settings: AppSettings
  google: GoogleAccount | null
  googleConfigured: boolean
  syncLabel: NetworkSyncLabel
  pendingCount: number
  conflictCount: number
  toasts: Toast[]
  saveExpense: (input: {
    id?: string
    title: string
    description: string
    amount: number
    category: Expense['category']
    date: string
  }) => Promise<Expense>
  importExpenses: (rows: ParsedImportRow[]) => Promise<number>
  removeExpense: (id: string) => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  refreshGoogle: () => Promise<void>
  syncNow: () => Promise<void>
  wipeLocal: () => Promise<void>
  resolveExpenseConflict: (id: string, keep: 'local' | 'cloud') => Promise<void>
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    currency: 'INR',
    theme: 'warm',
    lastSyncAt: null,
    spreadsheetId: null,
    spreadsheetName: null,
  })
  const [google, setGoogle] = useState<GoogleAccount | null>(null)
  const [googleConfigured, setGoogleConfigured] = useState(false)
  const [syncLabel, setSyncLabel] = useState<NetworkSyncLabel>('Synced')
  const [pendingCount, setPendingCount] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = createId()
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const refreshLocal = useCallback(async () => {
    const [all, queue, stored] = await Promise.all([getAllExpenses(), getQueue(), getSettings()])
    setExpenses(
      all
        .filter((item) => !item.deletedAt)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    )
    setPendingCount(queue.length)
    setSettings(stored)
    if (!stored.spreadsheetId) setSyncLabel('Local')
    else if (!navigator.onLine) setSyncLabel('Offline')
    else if (queue.length) setSyncLabel('Syncing')
    else setSyncLabel('Synced')
  }, [])

  const refreshGoogle = useCallback(async () => {
    try {
      const status = await fetchGoogleStatus()
      setGoogleConfigured(status.configured)
      setGoogle(status.account)
      if (status.account) {
        const stored = await getSettings()
        const next = {
          ...stored,
          spreadsheetId: status.account.spreadsheetId,
          spreadsheetName: status.account.spreadsheetName,
        }
        await saveSettings(next)
        setSettings(next)
      }
    } catch {
      setGoogleConfigured(false)
      setGoogle(null)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (!google?.spreadsheetId) {
      await refreshLocal()
      return
    }
    setSyncLabel('Syncing')
    const outcome = await runSync()
    setSyncLabel(outcome.label)
    if (outcome.message && outcome.label === 'Sync failed') toast(outcome.message, 'error')
    await refreshLocal()
  }, [google?.spreadsheetId, refreshLocal, toast])

  useEffect(() => {
    let active = true
    ;(async () => {
      await refreshLocal()
      await refreshGoogle()
      if (active) setReady(true)
    })()
    return () => {
      active = false
    }
  }, [refreshGoogle, refreshLocal])

  useEffect(() => {
    if (!ready) return
    void syncNow()
  }, [ready, google?.spreadsheetId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onOnline = () => {
      setSyncLabel('Syncing')
      void syncNow()
    }
    const onOffline = () => setSyncLabel('Offline')
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [syncNow])

  const enqueue = useCallback(async (expense: Expense, op: QueueOp) => {
    await putQueueItem({
      id: createId(),
      expenseId: expense.id,
      op,
      payload: expense,
      attempts: 0,
      createdAt: new Date().toISOString(),
    })
  }, [])

  const saveExpense = useCallback(
    async (input: {
      id?: string
      title: string
      description: string
      amount: number
      category: Expense['category']
      date: string
    }) => {
      const now = new Date().toISOString()
      const existing = input.id ? expenses.find((item) => item.id === input.id) : undefined
      const expense: Expense = {
        id: input.id ?? createId(),
        title: sanitizeText(input.title, 80),
        description: sanitizeText(input.description, 240),
        amount: input.amount,
        category: input.category,
        date: input.date,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending',
        conflictCloud: null,
      }
      await putExpense(expense)
      await enqueue(expense, existing ? 'update' : 'create')
      await refreshLocal()
      void syncNow()
      return expense
    },
    [enqueue, expenses, refreshLocal, syncNow],
  )

  const importExpenses = useCallback(
    async (rows: ParsedImportRow[]) => {
      if (!rows.length) return 0
      const records = toExpenseRecords(rows)
      await putExpenses(records)
      await refreshLocal()
      return records.length
    },
    [refreshLocal],
  )

  const removeExpense = useCallback(
    async (id: string) => {
      const current = expenses.find((item) => item.id === id)
      if (!current) return
      const now = new Date().toISOString()
      const tombstone: Expense = {
        ...current,
        deletedAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      }
      await putExpense(tombstone)
      await removeQueueForExpense(id)
      await enqueue(tombstone, 'delete')
      await refreshLocal()
      void syncNow()
    },
    [enqueue, expenses, refreshLocal, syncNow],
  )

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const stored = await getSettings()
    const next = { ...stored, ...patch }
    await saveSettings(next)
    setSettings(next)
  }, [])

  const wipeLocal = useCallback(async () => {
    await clearExpenses()
    await refreshLocal()
  }, [refreshLocal])

  const resolveExpenseConflict = useCallback(
    async (id: string, keep: 'local' | 'cloud') => {
      await resolveConflict(id, keep)
      await refreshLocal()
      void syncNow()
    },
    [refreshLocal, syncNow],
  )

  const conflictCount = useMemo(
    () => expenses.filter((item) => item.syncStatus === 'conflict').length,
    [expenses],
  )

  const value = useMemo(
    () => ({
      ready,
      expenses,
      settings,
      google,
      googleConfigured,
      syncLabel,
      pendingCount,
      conflictCount,
      toasts,
      saveExpense,
      importExpenses,
      removeExpense,
      updateSettings,
      refreshGoogle,
      syncNow,
      wipeLocal,
      resolveExpenseConflict,
      toast,
      dismissToast,
    }),
    [
      conflictCount,
      dismissToast,
      expenses,
      google,
      googleConfigured,
      importExpenses,
      pendingCount,
      ready,
      refreshGoogle,
      removeExpense,
      resolveExpenseConflict,
      saveExpense,
      settings,
      syncLabel,
      syncNow,
      toast,
      toasts,
      updateSettings,
      wipeLocal,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
