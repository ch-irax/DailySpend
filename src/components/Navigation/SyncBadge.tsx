import { Cloud, CloudOff, LoaderCircle, CloudAlert, HardDrive } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export function SyncBadge() {
  const { syncLabel, pendingCount, syncNow, google, toast } = useApp()

  function handleClick() {
    if (!google?.spreadsheetId) {
      toast('All records are saved directly to this device (IndexedDB). Cloud sync is optional.', 'info')
      return
    }
    void syncNow()
  }

  const isLocal = !google?.spreadsheetId || syncLabel === 'Local'

  const Icon = isLocal
    ? HardDrive
    : syncLabel === 'Offline'
      ? CloudOff
      : syncLabel === 'Syncing'
        ? LoaderCircle
        : syncLabel === 'Sync failed'
          ? CloudAlert
          : Cloud

  const label = isLocal ? 'Saved on device' : syncLabel

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isLocal ? 'Saved locally on your device' : 'Click to sync'}
      className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-3 text-xs text-coffee shadow-[var(--shadow-card)] transition hover:bg-cream/50"
    >
      <Icon className={`size-3.5 ${!isLocal && syncLabel === 'Syncing' ? 'animate-spin' : 'text-sage'}`} />
      <span>{label}</span>
      {!isLocal && pendingCount ? ` · ${pendingCount}` : ''}
    </button>
  )
}
