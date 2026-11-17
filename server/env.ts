import dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:5173/api/auth/google/callback',
  googleApiKey: process.env.GOOGLE_API_KEY ?? '',
  googleProjectNumber: process.env.GOOGLE_PROJECT_NUMBER ?? '',
  isProd: process.env.NODE_ENV === 'production',
}

export function googleConfigured(): boolean {
  return Boolean(env.googleClientId && env.googleClientSecret && env.sessionSecret)
}
