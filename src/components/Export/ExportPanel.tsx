import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import {
  buildCsv,
  buildExcel,
  buildPdf,
  downloadBlob,
  filenameFor,
  filterForExport,
  shareOrDownload,
  type ExportRange,
} from '../../services/exportService'
import { monthLabel } from '../../utils/date'
import { Button } from '../UI/Button'

export function ExportPanel() {
  const { expenses, settings, pendingCount, toast } = useApp()
  const [range, setRange] = useState<ExportRange>('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)

  const filtered = filterForExport(expenses, range, from, to)
  const period =
    range === 'today'
      ? 'Today'
      : range === 'week'
        ? 'This week'
        : range === 'month'
          ? monthLabel()
          : range === 'all'
            ? 'All time'
            : `${from || '…'} to ${to || '…'}`

  function warnIfPending() {
    if (pendingCount) {
      toast('Some changes are still waiting to sync. This export uses your local records.', 'info')
    }
  }

  async function run(kind: 'xlsx' | 'csv' | 'pdf', share = false) {
    setBusy(true)
    try {
      warnIfPending()
      const blob =
        kind === 'xlsx'
          ? buildExcel(filtered)
          : kind === 'csv'
            ? buildCsv(filtered)
            : buildPdf(filtered, settings.currency, period)
      const name = filenameFor(kind, range)
      if (share) await shareOrDownload(blob, name, 'DailySpend export')
      else await downloadBlob(blob, name)
    } catch {
      toast('Could not create that file right now.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-lg font-semibold">Export & Download</h2>
      <p className="mt-1 text-sm text-taupe">Take your records with you — Excel, PDF, or CSV.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ['today', 'Today'],
            ['week', 'This week'],
            ['month', 'This month'],
            ['custom', 'Custom'],
            ['all', 'All time'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRange(value)}
            className={`rounded-full px-3 text-sm ${range === value ? 'bg-rose text-white' : 'bg-cream text-coffee'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {range === 'custom' ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
        </div>
      ) : null}

      <p className="mt-3 text-sm text-coffee">{filtered.length} record{filtered.length === 1 ? '' : 's'} in this range.</p>

      <div className="mt-4 grid gap-3">
        <Button variant="soft" disabled={busy} icon={<Download className="size-4" />} onClick={() => void run('xlsx')}>
          Download Excel
        </Button>
        <Button variant="soft" disabled={busy} icon={<Download className="size-4" />} onClick={() => void run('pdf')}>
          Download PDF
        </Button>
        <Button variant="soft" disabled={busy} icon={<Download className="size-4" />} onClick={() => void run('csv')}>
          Download CSV
        </Button>
        <Button variant="ghost" disabled={busy} icon={<Share2 className="size-4" />} onClick={() => void run('pdf', true)}>
          Share PDF
        </Button>
      </div>
    </section>
  )
}
