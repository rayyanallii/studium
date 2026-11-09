import { isSameOriginRequest } from '@freebuff/auth'
import { Hono } from 'hono'

import { appOrigin } from '../auth'
import type { AppContext } from '../env'

/**
 * Same-origin proxy for Supabase Auth.
 *
 * Browser extensions, privacy modes and restrictive networks routinely block
 * cross-origin `fetch` calls to `*.supabase.co` even though the host resolves
 * and serves pages. Auth is the only Supabase surface the browser talks to, so
 * it goes through this Worker instead: the browser only ever calls `/api/auth`,
 * and the Worker forwards to the configured project.
 *
 * The target is fixed by configuration, the path is restricted to `/auth/v1/`,
 * and mutations keep the same same-origin check as the rest of the API.
 */
export const authProxy = new Hono<AppContext>()

const REQUEST_HEADERS = ['authorization', 'content-type', 'x-client-info', 'x-supabase-api-version', 'accept', 'accept-language', 'user-agent']
const RESPONSE_HEADERS = ['content-type', 'x-supabase-api-version', 'location']

authProxy.all('/*', async (c) => {
  const request = c.req.raw
  const supabaseUrl = c.env.SUPABASE_URL
  const publishableKey = c.env.SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !publishableKey) return c.json({ error: 'Authentication is not configured.' }, 503)

  if (request.method !== 'GET' && request.method !== 'HEAD' && !isSameOriginRequest(request, appOrigin(c.env, request))) {
    return c.json({ error: 'Cross-origin request refused.' }, 403)
  }

  const incoming = new URL(request.url)
  const path = incoming.pathname.replace(/^\/api\/auth/, '')
  if (!path.startsWith('/') || path.includes('..') || path.startsWith('//')) {
    return c.json({ error: 'Not found.' }, 404)
  }

  const target = `${supabaseUrl.replace(/\/$/, '')}/auth/v1${path}${incoming.search}`
  const headers = new Headers()
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  // Never trust a client-supplied project key; use the configured one.
  headers.set('apikey', publishableKey)

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
    })
  } catch {
    return c.json({ error: 'The authentication service is unreachable.' }, 502)
  }

  const responseHeaders = new Headers()
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) responseHeaders.set(name, value)
  }
  responseHeaders.set('Cache-Control', 'no-store')
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
})
