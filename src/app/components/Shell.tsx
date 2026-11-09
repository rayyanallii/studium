import {
  BookOpen,
  CalendarDays,
  ChartNoAxesColumn,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu as MenuIcon,
  Settings,
  Timer,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { BRAND } from '../../shared/types'
import { useMe } from '../lib/api'
import { supabase } from '../lib/supabase'
import { cx } from '../lib/cx'
import { ThemeToggle } from './ThemeProvider'
import { Avatar, Button, Drawer, Menu } from './ui'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesColumn },
]

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <NavLink to="/dashboard" className={cx('inline-flex items-center gap-2.5 text-[16px] font-semibold tracking-tight', className)}>
      <span className="relative grid size-8 shrink-0 place-items-center rounded-[7px] border border-line-strong bg-surface-2 text-fg">
        <BookOpen className="size-[18px]" strokeWidth={1.7} />
      </span>
      {!compact && <span className="text-[19px] font-semibold tracking-[-0.04em]">{BRAND}</span>}
    </NavLink>
  )
}

export function signOut() {
  if (supabase) {
    void supabase.auth.signOut().then(({ error }) => { if (!error) window.location.assign('/login') })
    return
  }
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/auth/freebuff/signout'
  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = 'returnTo'
  input.value = '/'
  form.appendChild(input)
  document.body.appendChild(form)
  form.submit()
}

export function Shell() {
  const { data: me } = useMe()
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const currentPage = NAV.find(item => location.pathname.startsWith(item.to))?.label ?? 'Settings'
  const name = me?.user.name ?? me?.user.email ?? 'You'
  const isDev = me?.capabilities.auth === 'development'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      'flex h-10 items-center gap-3 rounded-control px-3 text-[13.5px] font-medium transition-colors [&_svg]:size-4',
      isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-fg',
    )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-accent focus:p-3 focus:text-on-accent">Skip to content</a>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface/40 px-4 py-6 lg:flex">
        <div className="px-1">
          <Logo />
        </div>
        <p className="mt-5 border-b border-line px-2 pb-4 text-[12px] text-muted">Personal workspace</p>

        <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon />
              {label}
              {to === '/tasks' && Boolean(me?.counts.openTasks) && <span className="ml-auto text-[11px] tabular text-muted">{me?.counts.openTasks}</span>}
            </NavLink>
          ))}
          <div className="my-3 h-px bg-line" />
          <NavLink to="/settings" className={linkClass}>
            <Settings />
            Settings
          </NavLink>
        </nav>

        <NavLink to="/focus" className="mb-5 flex items-center gap-3 rounded-control border border-line px-3 py-3 text-[12px] text-muted hover:bg-surface-2 hover:text-fg"><Timer className="size-4" /><span className="flex-1">Time to focus</span><ChevronRight className="size-3.5" /></NavLink>
        <div className="mt-4 border-t border-line pt-3">
          <Menu
            align="start"
            trigger={
              <button type="button" className="flex w-full items-center gap-2.5 rounded-tile p-1.5 text-left transition-colors hover:bg-surface-2">
                <Avatar name={name} src={me?.user.picture} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{name}</span>
                  <span className="block truncate text-[11.5px] text-faint">{isDev ? 'Local workspace' : me?.user.email}</span>
                </span>
                <MenuIcon className="size-4 text-faint" />
              </button>
            }
            items={[
              { label: 'Settings', icon: <Settings />, onSelect: () => (window.location.href = '/settings') },
              ...(isDev ? [] : [{ label: 'Sign out', icon: <LogOut />, danger: true, onSelect: signOut }]),
            ]}
          />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="hidden h-[65px] items-center gap-3 border-b border-line px-8 text-[12px] lg:flex">
          <span className="text-muted">Workspace</span><ChevronRight className="size-3 text-faint" /><span>{currentPage}</span>
          <span className="ml-auto text-muted">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: me?.profile.timezone ?? 'UTC' }).format(new Date())}</span>
        </header>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
          <Logo />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Menu
              trigger={
                <Button size="icon" variant="ghost" aria-label="Account">
                  <Avatar name={name} src={me?.user.picture} size={28} />
                </Button>
              }
              items={[
                { label: 'Settings', icon: <Settings />, onSelect: () => (window.location.href = '/settings') },
                ...(isDev ? [] : [{ label: 'Sign out', icon: <LogOut />, danger: true, onSelect: signOut }]),
              ]}
            />
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-28 pt-6 outline-none sm:px-8 sm:pt-9 lg:pb-12 xl:px-12">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Mobile">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1.5">
          {NAV.slice(0, 4).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cx(
                  'flex h-12 flex-col items-center justify-center gap-1 rounded-control text-[10.5px] font-medium transition-colors [&_svg]:size-[18px]',
                  isActive ? 'text-accent' : 'text-faint',
                )
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex h-12 flex-col items-center justify-center gap-1 rounded-control text-[10.5px] font-medium text-faint [&_svg]:size-[18px]"
          >
            <MenuIcon />
            More
          </button>
        </div>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col gap-1 p-3">
          {NAV.slice(4).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMoreOpen(false)} className={linkClass}>
              <Icon />
              {label}
            </NavLink>
          ))}
          <NavLink to="/settings" onClick={() => setMoreOpen(false)} className={linkClass}>
            <Settings />
            Settings
          </NavLink>
          {!isDev && (
            <button type="button" onClick={signOut} className={cx(linkClass({ isActive: false }), 'mt-2 text-danger hover:bg-danger-soft hover:text-danger')}>
              <LogOut />
              Sign out
            </button>
          )}
        </div>
      </Drawer>
    </div>
  )
}
