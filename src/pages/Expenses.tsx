import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Search, Trash2, Upload } from 'lucide-react'
import { CATEGORIES } from '../types/expense'
import { useExpenses } from '../hooks/useExpenses'
import { useApp } from '../context/AppContext'
import { ExpenseCard } from '../components/Expense/ExpenseCard'
import { EmptyState } from '../components/UI/EmptyState'
import { Modal } from '../components/UI/Modal'
import { Button } from '../components/UI/Button'
import { buildCsv, buildExcel, buildPdf, downloadBlob, filenameFor } from '../services/exportService'
import { parseImportFile } from '../services/importService'

export function ExpensesPage() {
  const navigate = useNavigate()
  const { expenses, settings, removeExpense, toast } = useExpenses()
  const { importExpenses } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered')
  const [downloading, setDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return expenses.filter((item) => {
      if (q && !`${item.title} ${item.description}`.toLowerCase().includes(q)) return false
      if (category !== 'all' && item.category !== category) return false
      if (from && item.date < from) return false
      if (to && item.date > to) return false
      return true
    })
  }, [category, expenses, from, query, to])

  async function handleDownload(kind: 'xlsx' | 'csv' | 'pdf') {
    setDownloading(true)
    try {
      const list = exportScope === 'filtered' ? filtered : expenses
      if (!list.length) {
        toast('No expenses to download in this selection.', 'info')
        return
      }
      const periodLabel = exportScope === 'filtered' && (from || to)
        ? `${from || 'start'} to ${to || 'now'}`
        : 'All expenses'
      const blob =
        kind === 'xlsx'
          ? buildExcel(list)
          : kind === 'csv'
            ? buildCsv(list)
            : buildPdf(list, settings.currency, periodLabel)
      const filename = filenameFor(kind, 'all')
      await downloadBlob(blob, filename)
      toast(`Downloaded ${filename}`)
      setExportOpen(false)
    } catch {
      toast('Failed to generate download file.', 'error')
    } finally {
      setDownloading(false)
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseImportFile(buffer)
      if (!parsed.length) {
        toast('Could not find valid expense records in this file.', 'error')
        return
      }
      const count = await importExpenses(parsed)
      toast(`Successfully imported ${count} expense${count === 1 ? '' : 's'}!`)
    } catch {
      toast('Could not read the uploaded file. Check the format.', 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">All expenses</h1>
          <p className="mt-1 text-sm text-taupe">Newest first, easy to scan.</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-coffee shadow-sm transition hover:bg-cream"
            title="Import expenses from CSV or Excel"
          >
            <Upload className="size-3.5" />
            Import
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-coffee shadow-sm transition hover:bg-cream"
            title="Download expenses"
          >
            <Download className="size-3.5" />
            Download
          </button>
        </div>
      </div>

      <label className="relative mt-5 block">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-taupe" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or description"
          className="field pl-11"
        />
      </label>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          All
        </Chip>
        {CATEGORIES.map((item) => (
          <Chip key={item} active={category === item} onClick={() => setCategory(item)}>
            {item}
          </Chip>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-xs text-taupe">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field mt-1" />
        </label>
        <label className="text-xs text-taupe">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field mt-1" />
        </label>
      </div>

      {expenses.length === 0 ? (
        <EmptyState onAdd={() => navigate('/add')} />
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-taupe">Nothing matches those filters.</p>
          ) : (
            filtered.map((expense, index) => (
              <div key={expense.id} className="flex items-stretch gap-2">
                <div className="min-w-0 flex-1">
                  <ExpenseCard
                    expense={expense}
                    currency={settings.currency}
                    delay={Math.min(index, 8) * 0.04}
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${expense.title}`}
                  className="flex min-h-[76px] w-12 items-center justify-center rounded-[22px] border border-line bg-white text-rose"
                  onClick={() => setPendingDelete(expense.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <Modal open={exportOpen} title="Download expenses" onClose={() => setExportOpen(false)}>
        <p className="text-sm text-taupe">Save your expense records directly to your device.</p>

        <div className="mt-4 flex gap-2 rounded-2xl bg-cream/70 p-1">
          <button
            type="button"
            onClick={() => setExportScope('filtered')}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${
              exportScope === 'filtered' ? 'bg-white text-ink shadow-sm' : 'text-taupe'
            }`}
          >
            Current view ({filtered.length})
          </button>
          <button
            type="button"
            onClick={() => setExportScope('all')}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${
              exportScope === 'all' ? 'bg-white text-ink shadow-sm' : 'text-taupe'
            }`}
          >
            All records ({expenses.length})
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button
            variant="soft"
            disabled={downloading}
            onClick={() => void handleDownload('xlsx')}
            className="w-full justify-center"
          >
            Download Excel (.xlsx)
          </Button>
          <Button
            variant="soft"
            disabled={downloading}
            onClick={() => void handleDownload('csv')}
            className="w-full justify-center"
          >
            Download CSV (.csv)
          </Button>
          <Button
            variant="soft"
            disabled={downloading}
            onClick={() => void handleDownload('pdf')}
            className="w-full justify-center"
          >
            Download PDF Report (.pdf)
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(pendingDelete)} title="Delete this expense?" onClose={() => setPendingDelete(null)}>
        <p>This removes it from DailySpend. If Google Sheets is connected, the cloud copy will be removed on the next sync. This cannot be undone.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setPendingDelete(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              if (pendingDelete) {
                await removeExpense(pendingDelete)
                toast('Expense deleted.', 'info')
              }
              setPendingDelete(null)
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 text-sm ${active ? 'bg-rose text-white' : 'bg-white text-coffee border border-line'}`}
    >
      {children}
    </button>
  )
}
