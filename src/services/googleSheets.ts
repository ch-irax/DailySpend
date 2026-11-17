import type { CloudExpense, Expense } from '../types/expense'
import { api } from './api'

export async function createDailySpendSheet() {
  return api<{ spreadsheetId: string; spreadsheetName: string }>('/api/sheets/create', {
    method: 'POST',
  })
}

export async function connectSpreadsheet(spreadsheetId: string) {
  return api<{ spreadsheetId: string; spreadsheetName: string }>('/api/sheets/connect', {
    method: 'POST',
    body: JSON.stringify({ spreadsheetId }),
  })
}

export async function pullCloudExpenses(): Promise<CloudExpense[]> {
  const data = await api<{ expenses: CloudExpense[] }>('/api/sheets/expenses')
  return data.expenses
}

export async function pushExpense(expense: Expense) {
  await api('/api/sheets/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  })
}

export async function removeCloudExpense(id: string) {
  await api(`/api/sheets/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function syncBatch(ops: Array<{ id: string; expenseId: string; op: string; payload: Expense }>) {
  return api<{
    results: Array<{ id: string; ok: boolean; message?: string }>
    expenses: CloudExpense[]
  }>('/api/sheets/sync', {
    method: 'POST',
    body: JSON.stringify({ ops }),
  })
}
