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
  Search,
  type LucideIcon,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'

import { BRAND } from '../../shared/types'
import { useStudyArtifacts } from '../lib/study-api'
import { useMe } from '../lib/api'
import { signOut } from '../lib/auth'
import { cx } from '../lib/cx'
import { AccountMenu } from './AccountMenu'
import { BrandMark } from './BrandMark'
import { Button, Dialog, Drawer, Input } from './ui'

type NavItem = { to: string; label: string; icon: LucideIcon }

// Flashcards, quizzes and notebooks live inside Study library, so they are not
// separate destinations in the rail. The routes stay valid for direct links.
const OVERVIEW: NavItem = { to: '/dashboard', label: 'Overview', icon: LayoutDashboard }
const SUBJECTS: NavItem = { to: '/subjects', label: 'Subjects', icon: BookOpen }
const LIBRARY: NavItem = { to: '/library', label: 'Study library', icon: Library }
const PLANNER: NavItem = { to: '/planner', label: 'Planner', icon: CalendarDays }
const TASKS: NavItem = { to: '/tasks', label: 'Tasks', icon: ListChecks }
const FOCUS: NavItem = { to: '/focus', label: 'Focus', icon: Timer }
const ANALYTICS: NavItem = { to: '/analytics', label: 'Analytics', icon: ChartNoAxesColumn }

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  { items: [OVERVIEW] },
  { label: 'Study', items: [SUBJECTS, LIBRARY] },
  { label: 'Plan', items: [PLANNER, TASKS, FOCUS] },
  { label: 'Progress', items: [ANALYTICS] },
]
const NAV = NAV_GROUPS.flatMap((group) => group.items)
const MOBILE_PRIMARY = ['/dashboard', '/subjects', '/library', '/planner']
const MOBILE_MORE = NAV.filter((item) => !MOBILE_PRIMARY.includes(item.to))

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <NavLink to="/dashboard" className={cx('inline-flex items-center gap-2.5 text-[16px] font-semibold tracking-tight', className)}>
      <BrandMark className="size-10 sm:size-11" />
      {!compact && <span className="text-[26px] font-semibold tracking-[-0.04em]">{BRAND}</span>}
    </NavLink>
  )
}

export function Shell() {
  const { data: me } = useMe()
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(current => !current) } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [])
  const isDev = me?.capabilities.auth === 'development'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      'flex min-h-12 shrink-0 items-center gap-3.5 rounded-[16px] px-4 py-3 text-[17px] font-medium leading-6 transition-colors [&_svg]:size-[22px] [&_svg]:shrink-0',
      isActive ? 'bg-raised text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
    )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-[72px_minmax(0,1fr)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-accent focus:p-3 focus:text-on-accent">Skip to content</a>
      <header className="sticky top-0 z-30 col-span-2 grid h-[72px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-line bg-bg px-4 sm:gap-6 lg:grid-cols-[1fr_minmax(240px,400px)_1fr] lg:px-6">
        <Logo className="justify-self-start max-sm:gap-2 max-sm:[&>span:last-child]:text-[22px]" />
        <button type="button" onClick={() => setSearchOpen(true)} className="flex h-10 w-10 items-center justify-center justify-self-end gap-3 rounded-[14px] bg-surface-2 text-muted sm:h-11 sm:w-full sm:max-w-[400px] sm:justify-start sm:justify-self-center sm:px-4" aria-label="Search workspace"><Search className="size-5 shrink-0" /><span className="hidden sm:inline">Search</span><kbd className="ml-auto hidden rounded-md border border-line-strong px-1.5 py-0.5 text-xs sm:inline">Ctrl K</kbd></button>
        <div className="flex items-center justify-self-end gap-2 sm:gap-3"><Button variant="ghost" size="icon" aria-label="Start focus session" onClick={() => navigate('/focus')}><Timer /></Button><AccountMenu /></div>
      </header>
      <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] flex-col border-r border-line bg-bg px-3 py-4 lg:flex">
        <p className="px-4 text-[14px] font-medium text-faint">Personal workspace</p>
        <nav className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto pb-2" aria-label="Main">
          {NAV_GROUPS.map((group, index) => (
            <div key={group.label ?? index} className="flex flex-col gap-1">
              {group.label && <p className="px-4 pb-1 pt-5 text-[13px] font-medium text-faint">{group.label}</p>}
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass}>
                  <Icon />
                  {label}
                  {to === '/tasks' && Boolean(me?.counts.openTasks) && <span className="ml-auto text-[11px] tabular text-muted">{me?.counts.openTasks}</span>}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="my-3 h-px shrink-0 bg-line" />
          <NavLink to="/settings" className={linkClass}>
            <Settings />
            Settings
          </NavLink>
          {isDev && <p className="px-4 pt-4 text-xs text-faint">Local workspace</p>}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-28 pt-6 outline-none sm:px-8 sm:pt-10 lg:pb-12 xl:px-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Mobile">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1.5">
          {NAV.filter((item) => MOBILE_PRIMARY.includes(item.to)).map(({ to, label, icon: Icon }) => (
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
          {MOBILE_MORE.map(({ to, label, icon: Icon }) => (
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
            <button type="button" onClick={() => void signOut()} className={cx(linkClass({ isActive: false }), 'mt-2 text-danger hover:bg-danger-soft hover:text-danger')}>
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
