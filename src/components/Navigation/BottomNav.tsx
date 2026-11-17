import { NavLink, useNavigate } from 'react-router-dom'
import { Home, List, PieChart, Plus, Settings } from 'lucide-react'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/expenses', label: 'Expenses', icon: List },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="nav-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-[430px] grid-cols-5 items-end px-2 pt-2">
        {items.slice(0, 2).map((item) => (
          <Tab key={item.to} {...item} />
        ))}
        <button
          type="button"
          aria-label="Add expense"
          onClick={() => navigate('/add')}
          className="-mt-7 mb-1 flex flex-col items-center justify-end"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-rose text-white shadow-[var(--shadow-soft)]">
            <Plus className="size-6" />
          </span>
        </button>
        {items.slice(2).map((item) => (
          <Tab key={item.to} {...item} />
        ))}
      </div>
    </nav>
  )
}

function Tab({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${
          isActive ? 'text-rose' : 'text-taupe'
        }`
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  )
}
