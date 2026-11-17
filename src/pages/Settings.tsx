import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ExportPanel } from '../components/Export/ExportPanel'
import { Button } from '../components/UI/Button'
import { Modal } from '../components/UI/Modal'
import { SyncBadge } from '../components/Navigation/SyncBadge'
import type { CurrencyCode, ThemeName } from '../types/expense'

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    wipeLocal,
    toast,
  } = useApp()
  const [confirmClear, setConfirmClear] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-taupe">Your space, your records, your preferences.</p>
        </div>
        <SyncBadge />
      </header>

      <section className="rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-semibold">Preferences</h2>
        <label className="mt-4 block text-sm">
          Currency
          <select
            className="field mt-2"
            value={settings.currency}
            onChange={(e) => void updateSettings({ currency: e.target.value as CurrencyCode })}
          >
            <option value="INR">INR · Indian Rupee</option>
            <option value="USD">USD · US Dollar</option>
            <option value="EUR">EUR · Euro</option>
            <option value="GBP">GBP · Pound Sterling</option>
          </select>
        </label>
        <label className="mt-4 block text-sm">
          Theme
          <select
            className="field mt-2"
            value={settings.theme}
            onChange={(e) => {
              const theme = e.target.value as ThemeName
              document.body.dataset.theme = theme
              void updateSettings({ theme })
            }}
          >
            <option value="warm">Warm cream</option>
            <option value="blush">Soft blush</option>
          </select>
        </label>
      </section>

      <ExportPanel />

      <section className="rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-semibold">Install DailySpend</h2>
        <p className="mt-2 text-sm leading-6 text-coffee">
          Add it to your home screen so it feels like a quiet little app of its own.
        </p>
        <Button variant="ghost" className="mt-3" onClick={() => setInstallOpen(true)}>
          How to install
        </Button>
      </section>

      <section className="rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-semibold">Local data</h2>
        <p className="mt-2 text-sm leading-6 text-coffee">
          Clearing local data will remove all expense records stored in this browser.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setConfirmClear(true)}>
          Clear local data
        </Button>
      </section>

      <section className="rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-semibold">About DailySpend</h2>
        <p className="mt-2 text-sm leading-6 text-coffee">
          A little space to keep track of where your money goes. DailySpend is a personal spending diary — not a bank, not a budget coach.
          Your records live securely on this device.
        </p>
      </section>

      <Modal open={confirmClear} title="Clear local data?" onClose={() => setConfirmClear(false)}>
        <p>This removes all expenses stored in this browser. This cannot be undone.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmClear(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              await wipeLocal()
              setConfirmClear(false)
              toast('Local data cleared.', 'info')
            }}
          >
            Clear data
          </Button>
        </div>
      </Modal>

      <Modal open={installOpen} title="Add to Home Screen" onClose={() => setInstallOpen(false)}>
        <div className="space-y-3 text-sm leading-6">
          <p>
            <strong>iPhone:</strong> Open DailySpend in Safari, tap Share, then Add to Home Screen.
          </p>
          <p>
            <strong>Android:</strong> Open DailySpend in Chrome, tap the menu, then Install app or Add to Home screen.
          </p>
        </div>
        <Button className="mt-4 w-full" onClick={() => setInstallOpen(false)}>
          Done
        </Button>
      </Modal>
    </div>
  )
}
