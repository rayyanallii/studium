import { isSameOriginRequest } from '@freebuff/auth'
import { Hono } from 'hono'

import { appOrigin } from '../auth'
import type { AppContext, Env } from '../env'

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

  const projectUrl: string = supabaseUrl
  const projectKey: string = publishableKey
  const target = `${projectUrl.replace(/\/$/, '')}/auth/v1${path}${incoming.search}`
  const requestBody = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer()

  // Local testing helper: the project has no mailer configured, so the public
  // signup endpoint would send a confirmation email that usually never arrives
  // (and hits the built-in SMTP rate limit). Create the confirmed account with
  // the server-only key and return a normal session instead. Off unless
  // AUTO_CONFIRM_SIGNUPS is set.
  if (path === '/signup' && request.method === 'POST' && c.env.AUTO_CONFIRM_SIGNUPS === '1' && c.env.SUPABASE_SECRET_KEY) {
    const local = await localSignup(c.env, projectUrl, projectKey, requestBody)
    if (local) return local
  }

  const headers = new Headers()
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  // Never trust a client-supplied project key; use the configured one.
  headers.set('apikey', projectKey)

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: requestBody,
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

/**
 * Create a confirmed account with the server key, then return a password-grant
 * session. Returns null when the request is not usable, so the caller falls back
 * to the normal proxy path.
 */
async function localSignup(env: Env, supabaseUrl: string, publishableKey: string, requestBody: ArrayBuffer | undefined): Promise<Response | null> {
  const secret = env.SUPABASE_SECRET_KEY
  if (!secret || !requestBody) return null
  const root = supabaseUrl.replace(/\/$/, '')
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store' } })

  let credentials: { email?: string; password?: string; data?: unknown }
  try {
    credentials = JSON.parse(new TextDecoder().decode(requestBody))
  } catch {
    return null
  }
  if (!credentials.email || !credentials.password) return null

  const adminHeaders = { apikey: secret, authorization: `Bearer ${secret}`, 'content-type': 'application/json' }
  const created = await fetch(`${root}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email: credentials.email, password: credentials.password, email_confirm: true, user_metadata: credentials.data }),
  }).catch(() => null)

  if (!created) return null
  if (created.status === 422) return json({ code: 422, error_code: 'user_already_exists', msg: 'User already registered' }, 422)
  if (!created.ok) return new Response(created.body, { status: created.status, headers: { 'content-type': 'application/json' } })

  const session = await fetch(`${root}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  }).catch(() => null)
  if (!session?.ok) return null
  return json(await session.json())
}
