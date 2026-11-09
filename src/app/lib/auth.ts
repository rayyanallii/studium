import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { supabase } from './supabase'

/** True when the browser holds a Supabase configuration. */
export const supabaseAuth = Boolean(supabase)

/**
 * The browser session is the source of truth for routing. The Worker still
 * verifies every bearer token, so this is a rendering gate, not authorization.
 */
export function useSession(): { loading: boolean; session: Session | null } {
  const [state, setState] = useState<{ loading: boolean; session: Session | null }>({
    loading: Boolean(supabase),
    session: null,
  })

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ loading: false, session: data.session })
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ loading: false, session })
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}

/** Sign out of Supabase, or of the Freebuff session on a deployed fallback. */
export async function signOut(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut()
    window.location.assign('/login')
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

/** Only allow in-app destinations so `?next=` cannot become an open redirect. */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  return value
}
