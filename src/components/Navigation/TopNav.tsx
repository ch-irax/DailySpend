import { NavLink, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/expenses', label: 'Expenses' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
]

export function TopNav() {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-cream/90 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-[1000px] items-center justify-between px-6">
        <NavLink to="/" className="font-display text-lg font-bold tracking-tight text-ink transition-opacity hover:opacity-85">
          DailySpend
        </NavLink>
        <nav className="flex items-center gap-1.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blush text-coffee shadow-xs font-semibold'
                    : 'text-taupe hover:bg-blush/60 hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => navigate('/add')}
            className="ml-3 inline-flex h-10 items-center gap-2 rounded-full bg-rose px-4 text-sm font-medium text-white shadow-xs transition-all duration-150 hover:bg-[#c97b80] hover:shadow-[var(--shadow-soft)] active:scale-98"
          >
            <Plus className="size-4" />
            Add Expense
          </button>
        </nav>
      </div>
    </header>
  )
}
