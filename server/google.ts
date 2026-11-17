import { google } from 'googleapis'
import { env } from './env.js'
import type { SessionData } from './session.js'

export const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
]

export const HEADERS = [
  'ID',
  'Title',
  'Description',
  'Amount',
  'Category',
  'Date',
  'CreatedAt',
  'UpdatedAt',
]

export interface SheetExpense {
  id: string
  title: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
  updatedAt: string
}

export function oauthClient() {
  return new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleRedirectUri)
}

export async function authedClient(session: SessionData) {
  const client = oauthClient()
  client.setCredentials({
    refresh_token: session.refreshToken,
    access_token: session.accessToken,
    expiry_date: session.accessExpiry,
  })

  if (!session.accessToken || Date.now() > session.accessExpiry - 60_000) {
    const { credentials } = await client.refreshAccessToken()
    session.accessToken = credentials.access_token ?? session.accessToken
    session.accessExpiry = credentials.expiry_date ?? Date.now() + 45 * 60 * 1000
    if (credentials.refresh_token) session.refreshToken = credentials.refresh_token
    client.setCredentials(credentials)
  }

  return client
}

function sheetsApi(auth: InstanceType<typeof google.auth.OAuth2>) {
  return google.sheets({ version: 'v4', auth })
}

export async function createSpreadsheet(auth: InstanceType<typeof google.auth.OAuth2>) {
  const sheets = sheetsApi(auth)
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'DailySpend Database' },
      sheets: [{ properties: { title: 'Expenses' } }],
    },
  })
  const id = created.data.spreadsheetId
  if (!id) throw new Error('Could not create spreadsheet')
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'Expenses!A1:H1',
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  })
  return { id, name: created.data.properties?.title ?? 'DailySpend Database' }
}

export async function spreadsheetTitle(
  auth: InstanceType<typeof google.auth.OAuth2>,
  spreadsheetId: string,
) {
  const sheets = sheetsApi(auth)
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'properties.title,sheets.properties.title',
  })
  const titles = meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) ?? []
  if (!titles.includes('Expenses')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'Expenses' } } }],
      },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Expenses!A1:H1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    })
  }
  return meta.data.properties?.title ?? 'DailySpend Database'
}

function rowToExpense(row: string[]): SheetExpense | null {
  const [id, title, description, amount, category, date, createdAt, updatedAt] = row
  if (!id || !title) return null
  const n = Number(amount)
  return {
    id,
    title,
    description: description ?? '',
    amount: Number.isFinite(n) ? n : 0,
    category: category ?? 'Other',
    date: date ?? '',
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: updatedAt ?? new Date().toISOString(),
  }
}

export function expenseToRow(expense: SheetExpense): string[] {
  return [
    expense.id,
    expense.title,
    expense.description,
    String(expense.amount),
    expense.category,
    expense.date,
    expense.createdAt,
    expense.updatedAt,
  ]
}

export async function readExpenses(
  auth: InstanceType<typeof google.auth.OAuth2>,
  spreadsheetId: string,
): Promise<SheetExpense[]> {
  const sheets = sheetsApi(auth)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Expenses!A2:H',
  })
  const rows = res.data.values ?? []
  return rows.map((row) => rowToExpense(row.map((cell) => String(cell ?? '')))).filter(Boolean) as SheetExpense[]
}

export async function upsertExpense(
  auth: InstanceType<typeof google.auth.OAuth2>,
  spreadsheetId: string,
  expense: SheetExpense,
) {
  const sheets = sheetsApi(auth)
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Expenses!A2:H',
  })
  const rows = existing.data.values ?? []
  const index = rows.findIndex((row) => String(row[0]) === expense.id)
  const values = [expenseToRow(expense)]
  if (index === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Expenses!A:H',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    })
    return
  }
  const rowNumber = index + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Expenses!A${rowNumber}:H${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}

export async function deleteExpenseRow(
  auth: InstanceType<typeof google.auth.OAuth2>,
  spreadsheetId: string,
  expenseId: string,
) {
  const sheets = sheetsApi(auth)
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  })
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === 'Expenses')
  const sheetId = sheet?.properties?.sheetId
  if (sheetId === undefined || sheetId === null) return

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Expenses!A2:A',
  })
  const rows = existing.data.values ?? []
  const index = rows.findIndex((row) => String(row[0]) === expenseId)
  if (index === -1) return
  const rowNumber = index + 2
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  })
}

export function validateSheetExpense(body: unknown): SheetExpense {
  if (!body || typeof body !== 'object') throw new Error('Invalid expense')
  const e = body as Record<string, unknown>
  const title = String(e.title ?? '').trim()
  const amount = Number(e.amount)
  const id = String(e.id ?? '').trim()
  const date = String(e.date ?? '').trim()
  const category = String(e.category ?? '').trim()
  if (!id || !title || !date || !category || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Expense is missing required fields')
  }
  return {
    id,
    title: title.slice(0, 80),
    description: String(e.description ?? '').slice(0, 240),
    amount: Math.round(amount * 100) / 100,
    category,
    date,
    createdAt: String(e.createdAt ?? new Date().toISOString()),
    updatedAt: String(e.updatedAt ?? new Date().toISOString()),
  }
}
