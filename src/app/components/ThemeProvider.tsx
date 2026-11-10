import { Theme as FrostTheme } from 'frosted-ui'
import { Moon, Sun } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { Theme } from '../../shared/types'
import { cx } from '../lib/cx'

type Resolved = 'light' | 'dark'

const ThemeContext = createContext<{ theme: Theme; resolved: Resolved; setTheme: (theme: Theme) => void }>({
  theme: 'dark',
  resolved: 'dark',
  setTheme: () => {},
})

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem('studium-theme')
    return value === 'light' || value === 'dark' || value === 'system' ? value : null
  } catch {
    return null
  }
}

export function ThemeProvider({ preference, onChange, children }: { preference: Theme; onChange?: (theme: Theme) => void; children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => storedTheme() ?? preference ?? 'dark')
  const [systemDark, setSystemDark] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches))

  useEffect(() => {
    setThemeState(preference)
  }, [preference])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    setSystemDark(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const resolved: Resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    try {
      localStorage.setItem('studium-theme', theme)
    } catch {
      /* storage may be unavailable */
    }
  }, [theme, resolved])

  const value = useMemo(
    () => ({
      theme,
      resolved,
      setTheme: (next: Theme) => {
        setThemeState(next)
        onChange?.(next)
      },
    }),
    [theme, resolved, onChange],
  )

  // Typography is defined for all Frosted theme boundaries in styles.css,
  // including the separate theme elements created by portals.
  const frostStyle = {
    minHeight: '100vh',
    background: 'var(--color-bg)',
  }

  return <ThemeContext.Provider value={value}><FrostTheme appearance="inherit" hasBackground={false} accentColor="blue" grayColor="gray" style={frostStyle}>{children}</FrostTheme></ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setTheme } = useTheme()
  const dark = resolved === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cx('grid size-10 shrink-0 place-items-center rounded-control border border-line bg-panel text-muted transition-colors hover:text-fg', className)}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
