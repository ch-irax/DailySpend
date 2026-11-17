import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'
import { Footer } from './Footer'
import { Toasts } from '../UI/Toast'

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-cream text-ink">
      <TopNav />
      <Toasts />
      <main className="mx-auto w-full max-w-[1000px] flex-1 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-6 md:px-6 md:pt-8 md:pb-12">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
