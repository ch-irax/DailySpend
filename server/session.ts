import crypto from 'node:crypto'
import type { Request, Response } from 'express'

const COOKIE = 'dailyspend_session'
const STATE_COOKIE = 'dailyspend_oauth_state'
const ALG = 'aes-256-gcm'

export interface SessionData {
  refreshToken: string
  accessToken: string
  accessExpiry: number
  email: string
  name: string
  picture: string | null
  spreadsheetId: string | null
  spreadsheetName: string | null
}

function keyFromSecret(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(payload: unknown, secret: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALG, keyFromSecret(secret), iv)
  const encoded = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(payload), 'utf8')),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encoded]).toString('base64url')
}

export function decrypt<T>(token: string, secret: string): T {
  const buf = Buffer.from(token, 'base64url')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = crypto.createDecipheriv(ALG, keyFromSecret(secret), iv)
  decipher.setAuthTag(tag)
  const json = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  return JSON.parse(json) as T
}

function cookieOptions(maxAge: number, secure: boolean) {
  const isProd = secure || process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge,
  }
}

export function setSession(res: Response, data: SessionData, secret: string, secure: boolean) {
  res.cookie(COOKIE, encrypt(data, secret), cookieOptions(1000 * 60 * 60 * 24 * 30, secure))
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { path: '/' })
  res.clearCookie(STATE_COOKIE, { path: '/' })
}

export function readSession(req: Request, secret: string): SessionData | null {
  const raw = req.cookies?.[COOKIE]
  if (!raw || !secret) return null
  try {
    return decrypt<SessionData>(raw, secret)
  } catch {
    return null
  }
}

export function setOAuthState(res: Response, state: string, secret: string, secure: boolean) {
  res.cookie(STATE_COOKIE, encrypt({ state }, secret), cookieOptions(1000 * 60 * 10, secure))
}

export function readOAuthState(req: Request, secret: string): string | null {
  const raw = req.cookies?.[STATE_COOKIE]
  if (!raw || !secret) return null
  try {
    return decrypt<{ state: string }>(raw, secret).state
  } catch {
    return null
  }
}

export function clearOAuthState(res: Response) {
  res.clearCookie(STATE_COOKIE, { path: '/' })
}
