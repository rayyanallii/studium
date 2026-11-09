import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * Auth calls go through the Worker at `/api/auth`.
 *
 * The database itself is never queried from the browser (workspace reads and
 * writes go through `/api`), so auth is the only Supabase request made here.
 * Keeping it same-origin means a blocked third-party fetch — an extension, a
 * privacy mode or a restrictive network — cannot stop sign-in.
 */
const authFetch: typeof fetch = (input, init) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (url) {
    try {
      const target = new URL(raw, window.location.origin)
      const base = new URL(url)
      if (target.origin === base.origin && target.pathname.startsWith('/auth/v1/')) {
        const proxied = `${window.location.origin}/api/auth${target.pathname.slice('/auth/v1'.length)}${target.search}`
        return input instanceof Request ? fetch(new Request(proxied, input)) : fetch(proxied, init)
      }
    } catch {
      /* Not a Supabase auth request; fall through. */
    }
  }
  return fetch(input as RequestInfo, init)
}

// Only the publishable key belongs in the browser. Authorization is verified
// again by the API before reading or writing any workspace data.
export const supabase = url && key ? createClient(url, key, { global: { fetch: authFetch } }) : null
