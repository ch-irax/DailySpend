import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { todayISO, startOfMonthISO } from '../utils/date'
import type { Category } from '../types/expense'

export function useExpenses() {
  const app = useApp()
  const live = app.expenses

  const stats = useMemo(() => {
    const today = todayISO()
    const monthStart = startOfMonthISO()
    const todayTotal = live.filter((item) => item.date === today).reduce((sum, item) => sum + item.amount, 0)
    const monthItems = live.filter((item) => item.date >= monthStart)
    const monthTotal = monthItems.reduce((sum, item) => sum + item.amount, 0)
    const byCategory = monthItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount
      return acc
    }, {})
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
    return {
      todayTotal,
      monthTotal,
      count: live.length,
      monthCount: monthItems.length,
      byCategory,
      topCategory: topCategory ? { category: topCategory[0] as Category, amount: topCategory[1] } : null,
    }
  }, [live])

  return { ...app, expenses: live, stats }
}
