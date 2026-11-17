import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { google } from 'googleapis'
import { env, googleConfigured } from './env.js'
import {
  authedClient,
  createSpreadsheet,
  deleteExpenseRow,
  oauthClient,
  readExpenses,
  SCOPES,
  spreadsheetTitle,
  upsertExpense,
  validateSheetExpense,
} from './google.js'
import {
  clearOAuthState,
  clearSession,
  readOAuthState,
  readSession,
  setOAuthState,
  setSession,
  type SessionData,
} from './session.js'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, '../dist')

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

function requireConfigured(_req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!googleConfigured()) {
    res.status(503).json({
      ok: false,
      message: 'Google connection is not configured on the server yet.',
    })
    return
  }
  next()
}

function requireSession(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = readSession(req, env.sessionSecret)
  if (!session) {
    res.status(401).json({ ok: false, message: 'Please connect your Google account again.' })
    return
  }
  ;(req as express.Request & { session: SessionData }).session = session
  next()
}

function getSession(req: express.Request): SessionData {
  return (req as express.Request & { session: SessionData }).session
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/auth/status', (req, res) => {
  const session = googleConfigured() ? readSession(req, env.sessionSecret) : null
  res.json({
    ok: true,
    configured: googleConfigured(),
    connected: Boolean(session),
    account: session
      ? {
          email: session.email,
          name: session.name,
          picture: session.picture,
          spreadsheetId: session.spreadsheetId,
          spreadsheetName: session.spreadsheetName,
        }
      : null,
  })
})

app.get('/api/auth/google/start', requireConfigured, (req, res) => {
  const state = crypto.randomBytes(24).toString('hex')
  setOAuthState(res, state, env.sessionSecret, env.isProd)
  const client = oauthClient()
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: SCOPES,
    state,
  })
  res.redirect(url)
})

app.get('/api/auth/google/callback', requireConfigured, async (req, res) => {
  try {
    const expected = readOAuthState(req, env.sessionSecret)
    const state = String(req.query.state ?? '')
    const code = String(req.query.code ?? '')
    clearOAuthState(res)
    if (!code || !expected || state !== expected) {
      res.redirect(`${env.clientOrigin}/settings?google=denied`)
      return
    }
    const client = oauthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const me = await oauth2.userinfo.get()
    const previous = readSession(req, env.sessionSecret)
    const session: SessionData = {
      refreshToken: tokens.refresh_token ?? previous?.refreshToken ?? '',
      accessToken: tokens.access_token ?? '',
      accessExpiry: tokens.expiry_date ?? Date.now() + 45 * 60 * 1000,
      email: me.data.email ?? '',
      name: me.data.name ?? '',
      picture: me.data.picture ?? null,
      spreadsheetId: previous?.spreadsheetId ?? null,
      spreadsheetName: previous?.spreadsheetName ?? null,
    }
    if (!session.refreshToken) {
      res.redirect(`${env.clientOrigin}/settings?google=norefresh`)
      return
    }
    setSession(res, session, env.sessionSecret, env.isProd)
    res.redirect(`${env.clientOrigin}/settings?google=connected`)
  } catch {
    res.redirect(`${env.clientOrigin}/settings?google=error`)
  }
})

app.post('/api/auth/logout', (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

app.get('/api/auth/picker-config', requireConfigured, requireSession, async (req, res) => {
  try {
    const session = getSession(req)
    await authedClient(session)
    setSession(res, session, env.sessionSecret, env.isProd)
    res.json({
      ok: true,
      clientId: env.googleClientId,
      apiKey: env.googleApiKey,
      appId: env.googleProjectNumber,
      accessToken: session.accessToken,
      developerKey: env.googleApiKey,
    })
  } catch {
    res.status(401).json({ ok: false, message: 'Your Google session expired. Please reconnect.' })
  }
})

app.post('/api/sheets/create', requireConfigured, requireSession, async (req, res) => {
  try {
    const session = getSession(req)
    const client = await authedClient(session)
    const created = await createSpreadsheet(client)
    session.spreadsheetId = created.id
    session.spreadsheetName = created.name
    setSession(res, session, env.sessionSecret, env.isProd)
    res.json({ ok: true, spreadsheetId: created.id, spreadsheetName: created.name })
  } catch {
    res.status(400).json({
      ok: false,
      message: 'Could not create a DailySpend spreadsheet. Please try again.',
    })
  }
})

app.post('/api/sheets/connect', requireConfigured, requireSession, async (req, res) => {
  try {
    const session = getSession(req)
    const raw = String(req.body?.spreadsheetId ?? '')
    const spreadsheetId = extractSpreadsheetId(raw)
    if (!spreadsheetId) {
      res.status(400).json({ ok: false, message: 'Paste a valid Google Sheets link or ID.' })
      return
    }
    const client = await authedClient(session)
    const name = await spreadsheetTitle(client, spreadsheetId)
    session.spreadsheetId = spreadsheetId
    session.spreadsheetName = name
    setSession(res, session, env.sessionSecret, env.isProd)
    res.json({ ok: true, spreadsheetId, spreadsheetName: name })
  } catch {
    res.status(400).json({
      ok: false,
      message: 'Could not open that spreadsheet. Choose a sheet your Google account can edit.',
    })
  }
})

app.post('/api/sheets/disconnect-sheet', requireConfigured, requireSession, (req, res) => {
  const session = getSession(req)
  session.spreadsheetId = null
  session.spreadsheetName = null
  setSession(res, session, env.sessionSecret, env.isProd)
  res.json({ ok: true })
})

app.get('/api/sheets/expenses', requireConfigured, requireSession, async (req, res) => {
  try {
    const session = getSession(req)
    if (!session.spreadsheetId) {
      res.status(400).json({ ok: false, message: 'Connect a spreadsheet first.' })
      return
    }
    const client = await authedClient(session)
    setSession(res, session, env.sessionSecret, env.isProd)
    const expenses = await readExpenses(client, session.spreadsheetId)
    res.json({ ok: true, expenses })
  } catch (error) {
    handleGoogleError(res, error)
  }
})

app.post('/api/sheets/expenses', requireConfigured, requireSession, async (req, res) => {
  try {
    const session = getSession(req)
    if (!session.spreadsheetId) {
      res.status(400).json({ ok: false, message: 'Connect a spreadsheet first.' })
      return
    }
    const expense = validateSheetExpense(req.body)
    const client = await authedClient(session)
    await upsertExpense(client, session.spreadsheetId, expense)
    setSession(res, session, env.sessionSecret, env.isProd)
    res.json({ ok: true, expense })
  } catch (error) {
    handleGoogleError(res, error)
  }
})

app.delete('/api/sheets/expenses/:id', requireConfigured, requireSession, async (req, res) => {
  try {
    const session = getSession(req)
    if (!session.spreadsheetId) {
      res.status(400).json({ ok: false, message: 'Connect a spreadsheet first.' })
      return
    }
    const client = await authedClient(session)
    await deleteExpenseRow(client, session.spreadsheetId, String(req.params.id))
    setSession(res, session, env.sessionSecret, env.isProd)
    res.json({ ok: true })
  } catch (error) {
    handleGoogleError(res, error)
  }
})

app.post('/api/sheets/sync', requireConfigured, requireSession, async (req, res) => {
  try {
    const session = getSession(req)
    if (!session.spreadsheetId) {
      res.status(400).json({ ok: false, message: 'Connect a spreadsheet first.' })
      return
    }
    const ops = Array.isArray(req.body?.ops) ? req.body.ops : []
    const client = await authedClient(session)
    const results: Array<{ id: string; ok: boolean; message?: string }> = []
    for (const op of ops) {
      try {
        if (op.op === 'delete') {
          await deleteExpenseRow(client, session.spreadsheetId, String(op.expenseId))
        } else {
          const expense = validateSheetExpense(op.payload)
          await upsertExpense(client, session.spreadsheetId, expense)
        }
        results.push({ id: String(op.id), ok: true })
      } catch (error) {
        results.push({
          id: String(op.id),
          ok: false,
          message: error instanceof Error ? 'Could not sync this expense.' : 'Could not sync this expense.',
        })
      }
    }
    const expenses = await readExpenses(client, session.spreadsheetId)
    setSession(res, session, env.sessionSecret, env.isProd)
    res.json({ ok: true, results, expenses })
  } catch (error) {
    handleGoogleError(res, error)
  }
})

function extractSpreadsheetId(value: string): string | null {
  const trimmed = value.trim()
  const fromUrl = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (fromUrl?.[1]) return fromUrl[1]
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed
  return null
}

function handleGoogleError(res: express.Response, error: unknown) {
  const status = (error as { code?: number }).code
  if (status === 401 || status === 403) {
    res.status(401).json({
      ok: false,
      message: 'Google access expired or was revoked. Please reconnect your account.',
    })
    return
  }
  res.status(400).json({
    ok: false,
    message: 'Could not reach Google Sheets right now. Your local records are safe.',
  })
}

if (env.isProd) {
  app.use(express.static(dist))
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.listen(env.port, () => {
  console.log(`DailySpend server listening on http://127.0.0.1:${env.port}`)
})
