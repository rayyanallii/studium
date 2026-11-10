import { Hono } from 'hono'

import { authMode, getAuth, requireUser } from './auth'
import { requireDb } from './db'
import type { AppContext, Env } from './env'
import { aiKey } from './env'
import { analytics } from './routes/analytics'
import { authProxy } from './routes/authProxy'
import { assessments } from './routes/assessments'
import { availability } from './routes/availability'
import { demo } from './routes/demo'
import { focus } from './routes/focus'
import { plans } from './routes/plans'
import { profile } from './routes/profile'
import { sessions } from './routes/sessions'
import { subjects, topics } from './routes/subjects'
import { tasks } from './routes/tasks'
import { study } from './routes/study'
import { assistant } from './routes/assistant'
import { notebookNotes } from './routes/notebook-notes'

const app = new Hono<AppContext>()

app.get('/api/auth/status', (c) => {
  c.header('Cache-Control', 'private, no-store')
  return c.json({ mode: authMode(c.env, c.req.raw), database: Boolean(c.env.DB), files: Boolean(c.env.FILES), ai: Boolean(aiKey(c.env)) })
})
app.get('/api/health', (c) => c.json({ ok: true }))
// Same-origin auth proxy: the browser never calls Supabase directly.
app.route('/api/auth', authProxy)

const api = new Hono<AppContext>()
api.use('*', requireUser, requireDb)

api.route('/', profile)
api.route('/', demo)
api.route('/', analytics)
api.route('/subjects', subjects)
api.route('/topics', topics)
api.route('/tasks', tasks)
api.route('/study', study)
api.route('/assessments', assessments)
api.route('/availability', availability)
api.route('/plans', plans)
api.route('/sessions', sessions)
api.route('/focus', focus)
api.route('/assistant', assistant)
api.route('/notebooks', notebookNotes)
app.route('/api', api)

app.onError((error, c) => {
  console.error(error)
  return c.json({ success: false, error: { code: 'server_error', message: 'Something went wrong on our side. Try again.' } }, 500)
})
app.notFound((c) =>
  c.req.path.startsWith('/api/')
    ? c.json({ success: false, error: { code: 'not_found', message: 'Not found.' } }, 404)
    : c.env.ASSETS.fetch(c.req.raw),
)

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Sign in with Freebuff owns /auth/freebuff/* and keeps sessions fresh.
    // Without a client ID the app falls back to the loopback development user.
    const auth = getAuth(env, request)
    const handler = (req: Request) => Promise.resolve(app.fetch(req, env, ctx))
    return auth ? auth.wrap(handler)(request) : handler(request)
  },
}
