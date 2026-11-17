import type { GoogleAccount } from '../types/expense'
import { api } from './api'

export async function fetchGoogleStatus(): Promise<{
  configured: boolean
  connected: boolean
  account: GoogleAccount | null
}> {
  const data = await api<{
    configured: boolean
    connected: boolean
    account: Omit<GoogleAccount, 'configured'> | null
  }>('/api/auth/status')
  return {
    configured: data.configured,
    connected: data.connected,
    account: data.account ? { ...data.account, configured: data.configured } : null,
  }
}

export function startGoogleConnect() {
  window.location.href = '/api/auth/google/start'
}

export async function disconnectGoogle() {
  await api('/api/auth/logout', { method: 'POST' })
}

export async function fetchPickerConfig() {
  return api<{
    clientId: string
    apiKey: string
    appId: string
    accessToken: string
  }>('/api/auth/picker-config')
}
