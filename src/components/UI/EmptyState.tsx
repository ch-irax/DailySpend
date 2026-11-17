import { NotebookPen } from 'lucide-react'
import { Button } from './Button'

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-blush text-rose">
        <NotebookPen className="size-7" />
      </div>
      <h2 className="font-display mt-5 text-xl font-semibold text-ink">No expenses yet.</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-taupe">
        Your spending story starts here. Add a little note the next time money leaves your pocket.
      </p>
      <Button className="mt-6" onClick={onAdd}>
        Add your first expense
      </Button>
    </div>
  )
}
