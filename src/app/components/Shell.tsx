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
  Library,
  Layers,
  NotebookPen,
  ScanLine,
  Search,
  Plus,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'

import { BRAND } from '../../shared/types'
import { useStudyArtifacts } from '../lib/study-api'
import { useMe } from '../lib/api'
import { supabase } from '../lib/supabase'
import { cx } from '../lib/cx'
import { ThemeToggle } from './ThemeProvider'
import { Avatar, Button, Dialog, Drawer, Input, Menu } from './ui'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/library', label: 'Study library', icon: Library },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/quizzes', label: 'Quizzes', icon: ScanLine },
  { to: '/notebooks', label: 'AI Notebook', icon: NotebookPen },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesColumn },
]

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <NavLink to="/dashboard" className={cx('inline-flex items-center gap-2.5 text-[16px] font-semibold tracking-tight', className)}>
      <span className="relative grid size-8 shrink-0 place-items-center rounded-[7px] bg-[#ff5a1f] text-white">
        <BookOpen className="size-[18px]" strokeWidth={1.7} />
      </span>
      {!compact && <span className="text-[26px] font-semibold tracking-[-0.04em]">{BRAND}</span>}
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
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(current => !current) } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [])
  const name = me?.user.name ?? me?.user.email ?? 'You'
  const isDev = me?.capabilities.auth === 'development'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      'flex h-12 items-center gap-3.5 rounded-[16px] px-4 text-[17px] font-medium transition-colors [&_svg]:size-[22px]',
      isActive ? 'bg-raised text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
    )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-[72px_minmax(0,1fr)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-accent focus:p-3 focus:text-on-accent">Skip to content</a>
      <header className="sticky top-0 z-30 col-span-2 flex h-[72px] items-center gap-4 border-b border-line bg-bg px-4 lg:px-6">
        <Logo className="lg:w-[232px]" />
        <button type="button" onClick={() => setSearchOpen(true)} className="mx-auto flex h-11 w-full max-w-[400px] items-center gap-3 rounded-[14px] bg-surface-2 px-4 text-muted" aria-label="Search workspace"><Search className="size-5 shrink-0" /><span className="hidden sm:inline">Search</span><kbd className="ml-auto hidden rounded-md border border-line-strong px-1.5 text-xs sm:inline">Ctrl K</kbd></button>
        <div className="ml-auto flex items-center gap-2 sm:gap-4"><Button variant="ghost" size="icon" aria-label="Start focus session" onClick={() => navigate('/focus')}><Timer /></Button><ThemeToggle /><Menu trigger={<button type="button" aria-label="Account" className="rounded-full"><Avatar name={name} src={me?.user.picture} size={36} /></button>} items={[{ label: 'Settings', icon: <Settings />, onSelect: () => navigate('/settings') }, ...(isDev ? [] : [{ label: 'Sign out', icon: <LogOut />, onSelect: signOut }])]} /></div>
      </header>
      <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] flex-col border-r border-line bg-bg px-3 py-4 lg:flex">
        <div className="flex gap-3 px-1"><span className="grid size-14 place-items-center rounded-[17px] border-2 border-fg bg-surface-2" title="Personal workspace"><User className="size-6" /></span><button type="button" aria-label="Open study library" onClick={() => navigate('/library')} className="grid size-14 place-items-center rounded-[17px] bg-surface-2 text-muted hover:text-fg"><Plus className="size-7" /></button></div>
        <p className="mt-6 px-4 text-[14px] font-medium text-faint">Personal workspace</p>
        <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={state => cx(linkClass(state), to === '/planner' && 'mt-5')}>
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

        <p className="px-4 pt-4 text-xs text-faint">{isDev ? 'Local workspace' : name}</p>
      </aside>

      <div className="flex min-w-0 flex-col">
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-28 pt-6 outline-none sm:px-8 sm:pt-10 lg:pb-12 xl:px-10">
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

      {searchOpen && <WorkspaceSearch onClose={() => setSearchOpen(false)} />}
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

function WorkspaceSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const { data, isPending, isError } = useStudyArtifacts()
  const navigate = useNavigate()
  const needle = query.trim().toLowerCase()
  const pages = [...NAV, { to: '/settings', label: 'Settings', icon: Settings }].filter(item => item.label.toLowerCase().includes(needle))
  const sets = (data?.items ?? []).filter(item => item.title.toLowerCase().includes(needle))
  const go = (to: string) => { navigate(to); onClose() }
  return <Dialog open onClose={onClose} title="Search workspace" width={620} description="Find a page or one of your study sets.">
    <Input autoFocus aria-label="Search pages and study sets" placeholder="Search pages and study sets…" value={query} onChange={event => setQuery(event.target.value)} />
    <div className="mt-4 max-h-[55vh] overflow-y-auto"><p className="px-3 py-2 text-sm text-faint">Pages</p>{pages.map(item => <button key={item.to} type="button" onClick={() => go(item.to)} className="flex w-full items-center gap-3 rounded-control px-3 py-3 text-left hover:bg-surface-2"><item.icon className="size-5 text-muted" />{item.label}</button>)}<p className="px-3 py-2 text-sm text-faint">Study sets</p>{isPending && <p className="p-3 text-muted">Loading study sets…</p>}{isError && <p className="p-3 text-danger">Study sets could not be loaded.</p>}{sets.slice(0, 15).map(item => <button key={item.id} type="button" onClick={() => go(`/study/${item.id}`)} className="block w-full rounded-control px-3 py-3 text-left hover:bg-surface-2">{item.title}</button>)}{!isPending && !isError && !sets.length && <p className="p-3 text-muted">No matching study sets.</p>}</div>
  </Dialog>
}
