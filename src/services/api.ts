export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  })
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; ok?: boolean }
  if (!res.ok) {
    throw new ApiError(data.message ?? 'Something went wrong. Please try again.', res.status)
  }
  return data
}
