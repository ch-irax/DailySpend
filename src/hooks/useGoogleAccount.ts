import { useApp } from '../context/AppContext'

export function useGoogleAccount() {
  const { google, googleConfigured, refreshGoogle } = useApp()
  return { google, googleConfigured, refreshGoogle }
}
