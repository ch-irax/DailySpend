import { useApp } from '../context/AppContext'

export function useSync() {
  const { syncLabel, pendingCount, conflictCount, syncNow } = useApp()
  return { syncLabel, pendingCount, conflictCount, syncNow }
}
