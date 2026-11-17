import { AnimatePresence, motion } from 'motion/react'
import { Check, Info, TriangleAlert } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+12px)] right-4 left-4 z-[60] mx-auto flex max-w-md flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={() => dismissToast(toast.id)}
            className="pointer-events-auto flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-white px-4 text-left shadow-[var(--shadow-card)]"
          >
            {toast.tone === 'success' ? (
              <Check className="size-5 text-sage" />
            ) : toast.tone === 'error' ? (
              <TriangleAlert className="size-5 text-rose" />
            ) : (
              <Info className="size-5 text-coffee" />
            )}
            <span className="text-sm text-ink">{toast.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
