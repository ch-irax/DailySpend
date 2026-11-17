import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Navigation/Layout'
import { HomePage } from './pages/Home'
import { AddExpensePage } from './pages/AddExpense'
import { useApp } from './context/AppContext'

const ExpensesPage = lazy(() => import('./pages/Expenses').then((m) => ({ default: m.ExpensesPage })))
const AnalyticsPage = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.AnalyticsPage })))
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })))

export default function App() {
  const { settings, ready } = useApp()

  useEffect(() => {
    document.body.dataset.theme = settings.theme
  }, [settings.theme])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <p className="font-display text-lg text-coffee">DailySpend</p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-cream text-taupe">Loading…</div>
      }
    >
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddExpensePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/:id" element={<AddExpensePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
