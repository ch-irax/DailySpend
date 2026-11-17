import type { AppSettings, Expense, SyncQueueItem } from '../types/expense'

const DB_NAME = 'dailyspend'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('expenses')) {
        const store = db.createObjectStore('expenses', { keyPath: 'id' })
        store.createIndex('date', 'date')
        store.createIndex('updatedAt', 'updatedAt')
        store.createIndex('syncStatus', 'syncStatus')
      }
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id' })
        store.createIndex('expenseId', 'expenseId')
        store.createIndex('createdAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function getAllExpenses(): Promise<Expense[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction('expenses').objectStore('expenses').getAll()
    req.onsuccess = () => resolve((req.result as Expense[]) ?? [])
    req.onerror = () => reject(req.error)
  })
}

export async function putExpense(expense: Expense): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('expenses', 'readwrite')
  tx.objectStore('expenses').put(expense)
  await txDone(tx)
}

export async function putExpenses(expenses: Expense[]): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('expenses', 'readwrite')
  const store = tx.objectStore('expenses')
  for (const expense of expenses) store.put(expense)
  await txDone(tx)
}

export async function deleteExpenseRecord(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('expenses', 'readwrite')
  tx.objectStore('expenses').delete(id)
  await txDone(tx)
}

export async function clearExpenses(): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(['expenses', 'queue'], 'readwrite')
  tx.objectStore('expenses').clear()
  tx.objectStore('queue').clear()
  await txDone(tx)
}

export async function getQueue(): Promise<SyncQueueItem[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction('queue').objectStore('queue').getAll()
    req.onsuccess = () => {
      const items = (req.result as SyncQueueItem[]) ?? []
      items.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      resolve(items)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function putQueueItem(item: SyncQueueItem): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('queue', 'readwrite')
  tx.objectStore('queue').put(item)
  await txDone(tx)
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('queue', 'readwrite')
  tx.objectStore('queue').delete(id)
  await txDone(tx)
}

export async function removeQueueForExpense(expenseId: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('queue', 'readwrite')
  const store = tx.objectStore('queue')
  const index = store.index('expenseId')
  const req = index.getAll(expenseId)
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => {
      for (const item of req.result as SyncQueueItem[]) store.delete(item.id)
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
  await txDone(tx)
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'INR',
  theme: 'warm',
  lastSyncAt: null,
  spreadsheetId: null,
  spreadsheetName: null,
}

export async function getSettings(): Promise<AppSettings> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction('settings').objectStore('settings').get('app')
    req.onsuccess = () => {
      const row = req.result as { key: string; value: AppSettings } | undefined
      resolve({ ...DEFAULT_SETTINGS, ...(row?.value ?? {}) })
    }
    req.onerror = () => reject(req.error)
  })
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('settings', 'readwrite')
  tx.objectStore('settings').put({ key: 'app', value: settings })
  await txDone(tx)
}
