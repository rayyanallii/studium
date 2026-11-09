import { DropdownMenu, SegmentedControl } from 'frosted-ui'
import { LogOut, Settings } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { signOut } from '../lib/auth'
import { useMe } from '../lib/api'
import { Avatar } from './ui'
import { useTheme } from './ThemeProvider'

/**
 * Avatar popover: identity header, grouped navigation, a segmented appearance
 * control and sign out. Mirrors the reference account menu without copying it.
 */
export function AccountMenu() {
  const { data: me } = useMe()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const name = me?.user.name ?? me?.user.email ?? 'Your account'
  const email = me?.user.email
  const isDev = me?.capabilities.auth === 'development'

  const go = (path: string) => navigate(path)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <button
          type="button"
          aria-label="Account menu"
          className="grid size-10 shrink-0 place-items-center rounded-full outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Avatar name={name} src={me?.user.picture} size={36} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" sideOffset={10} className="w-[280px] p-2">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Avatar name={name} src={me?.user.picture} size={38} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium leading-5">{name}</p>
            <p className="truncate text-[13px] leading-5 text-faint">{email ?? (isDev ? 'Local development user' : 'Signed in')}</p>
          </div>
        </div>

        <div className="my-1.5 h-px bg-line" />

        <DropdownMenu.Item className="min-h-10 justify-start gap-3 px-3 py-2 [&_svg]:size-[18px]" onClick={() => go('/settings')}>
          <Settings />
          Settings
        </DropdownMenu.Item>

        <div className="my-1.5 h-px bg-line" />

        <div className="px-3 pb-1 pt-1.5">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-faint">Appearance</p>
          <SegmentedControl.Root value={theme} onValueChange={(value) => setTheme(value as typeof theme)}>
            <SegmentedControl.List aria-label="Appearance">
              <SegmentedControl.Trigger value="system">System</SegmentedControl.Trigger>
              <SegmentedControl.Trigger value="light">Light</SegmentedControl.Trigger>
              <SegmentedControl.Trigger value="dark">Dark</SegmentedControl.Trigger>
            </SegmentedControl.List>
          </SegmentedControl.Root>
        </div>

        {!isDev && (
          <>
            <div className="my-1.5 h-px bg-line" />
            <DropdownMenu.Item
              className="min-h-10 justify-start gap-3 px-3 py-2 [&_svg]:size-[18px]"
              onClick={() => {
                queryClient.clear()
                void signOut()
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
