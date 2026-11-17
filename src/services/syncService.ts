import {
  getAllExpenses,
  getQueue,
  putExpense,
  putExpenses,
  putQueueItem,
  removeQueueForExpense,
  removeQueueItem,
  saveSettings,
  getSettings,
} from '../database/indexedDB'
import { isCategory } from '../utils/validation'
import { createId } from '../utils/id'
import type { CloudExpense, Expense } from '../types/expense'
import { syncBatch } from './googleSheets'
import { ApiError } from './api'

export interface SyncOutcome {
  label: 'Synced' | 'Syncing' | 'Offline' | 'Sync failed'
  conflicts: number
  pending: number
  message?: string
}

function toLocal(cloud: CloudExpense): Expense | null {
  if (!isCategory(cloud.category)) return null
  return {
    id: cloud.id,
    title: cloud.title,
    description: cloud.description,
    amount: cloud.amount,
    category: cloud.category,
    date: cloud.date,
    createdAt: cloud.createdAt,
    updatedAt: cloud.updatedAt,
    deletedAt: null,
    syncStatus: 'synced',
    conflictCloud: null,
  }
}

export async function runSync(): Promise<SyncOutcome> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const pending = (await getQueue()).length
    return { label: 'Offline', conflicts: 0, pending }
  }

  const queue = await getQueue()
  try {
    const result = await syncBatch(
      queue.map((item) => ({
        id: item.id,
        expenseId: item.expenseId,
        op: item.op,
        payload: item.payload,
      })),
    )

    for (const item of result.results) {
      if (item.ok) await removeQueueItem(item.id)
    }

    const failed = result.results.filter((item) => !item.ok)
    const local = await getAllExpenses()
    const localMap = new Map(local.map((expense) => [expense.id, expense]))
    const remainingQueue = await getQueue()
    const queuedIds = new Set(remainingQueue.map((item) => item.expenseId))

    const merged: Expense[] = []
    let conflicts = 0

    for (const cloud of result.expenses) {
      const incoming = toLocal(cloud)
      if (!incoming) continue
      const current = localMap.get(cloud.id)

      if (!current) {
        merged.push(incoming)
        continue
      }

      if (current.deletedAt && queuedIds.has(current.id)) {
        merged.push(current)
        continue
      }

      if (queuedIds.has(current.id) && current.updatedAt !== cloud.updatedAt) {
        conflicts += 1
        merged.push({
          ...current,
          syncStatus: 'conflict',
          conflictCloud: cloud,
        })
        continue
      }

      if (queuedIds.has(current.id)) {
        merged.push(current)
        continue
      }

      if (current.updatedAt !== cloud.updatedAt && current.syncStatus !== 'synced') {
        conflicts += 1
        merged.push({
          ...current,
          syncStatus: 'conflict',
          conflictCloud: cloud,
        })
        continue
      }

      merged.push(incoming)
      localMap.delete(cloud.id)
    }

    for (const leftover of localMap.values()) {
      if (leftover.deletedAt) continue
      merged.push(leftover)
    }

    await putExpenses(merged)

    const settings = await getSettings()
    await saveSettings({ ...settings, lastSyncAt: new Date().toISOString() })

    const pending = (await getQueue()).length
    if (failed.length) {
      return {
        label: 'Sync failed',
        conflicts,
        pending,
        message: 'Some changes could not be written to Google Sheets.',
      }
    }
    return { label: pending ? 'Syncing' : 'Synced', conflicts, pending }
  } catch (error) {
    const pending = (await getQueue()).length
    if (error instanceof ApiError && error.status === 401) {
      return {
        label: 'Sync failed',
        conflicts: 0,
        pending,
        message: 'Google access expired. Reconnect your account in Settings.',
      }
    }
    return {
      label: navigator.onLine ? 'Sync failed' : 'Offline',
      conflicts: 0,
      pending,
      message: error instanceof Error ? error.message : undefined,
    }
  }
}

export async function resolveConflict(id: string, keep: 'local' | 'cloud'): Promise<void> {
  const expenses = await getAllExpenses()
  const current = expenses.find((item) => item.id === id)
  if (!current) return
  if (keep === 'cloud' && current.conflictCloud) {
    const cloud = toLocal(current.conflictCloud)
    if (cloud) await putExpense(cloud)
    await removeQueueForExpense(id)
    return
  }
  const next: Expense = {
    ...current,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending',
    conflictCloud: null,
  }
  await putExpense(next)
  await removeQueueForExpense(id)
  await putQueueItem({
    id: createId(),
    expenseId: next.id,
    op: 'update',
    payload: next,
    attempts: 0,
    createdAt: new Date().toISOString(),
  })
}
