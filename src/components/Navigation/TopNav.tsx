import { NavLink, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { LiquidMetalButton } from '@/components/ui/liquid-metal'

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
          <LiquidMetalButton
            size="sm"
            className="ml-3"
            icon={<ArrowRight className="w-4 h-4" />}
            metalConfig={{
              colorBack: '#3b82f6',
              colorTint: '#93c5fd',
            }}
            onClick={() => navigate('/add')}
          >
            Add Expense
          </LiquidMetalButton>
        </nav>
      </div>
    </header>
  )
}
