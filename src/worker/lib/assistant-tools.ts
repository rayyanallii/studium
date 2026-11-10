import { Hono, type Context } from 'hono'
import { z } from 'zod'
import type { AppContext } from '../env'
import { one } from '../db'
import { profile } from '../routes/profile'
import { subjects, topics } from '../routes/subjects'
import { tasks } from '../routes/tasks'
import { sessions } from '../routes/sessions'
import { assessments } from '../routes/assessments'
import { availability } from '../routes/availability'
import { analytics } from '../routes/analytics'
import { plans } from '../routes/plans'
import { focus } from '../routes/focus'
import { study } from '../routes/study'

const recordId = '[a-zA-Z0-9_-]+'
const readPaths = [
  '^/(me|subjects|tasks|assessments|availability|sessions|dashboard|analytics|plans)$',
  `^/(subjects|sessions)/${recordId}$`,
  '^/(plans|focus)/active$',
  `^/tasks/${recordId}/sessions$`,
  `^/analytics/subjects/${recordId}$`,
  '^/study/(materials|artifacts)$',
  `^/study/artifacts/${recordId}$`,
  `^/source/${recordId}$`,
].map(pattern => new RegExp(pattern))
const writePaths: Record<string, RegExp[]> = {
  POST: [
    '^/(subjects|tasks|assessments|sessions)$', `^/subjects/${recordId}/topics$`,
    `^/tasks/${recordId}/reopen$`, `^/sessions/${recordId}/(complete|skip)$`,
    '^/plans/(generate|replan)$', `^/plans/${recordId}/(accept|discard)$`,
    '^/study/generate$', '^/focus/start$', `^/focus/${recordId}/(pause|resume|finish|cancel)$`,
  ].map(pattern => new RegExp(pattern)),
  PATCH: ['^/me(/preferences)?$', `^/(subjects|topics|tasks|assessments|sessions)/${recordId}$`].map(pattern => new RegExp(pattern)),
  PUT: [/^\/availability(\/overrides)?$/],
  DELETE: [`^/(subjects|topics|tasks|assessments|sessions)/${recordId}$`, `^/study/(materials|artifacts)/${recordId}$`, `^/availability/overrides/${recordId}$`].map(pattern => new RegExp(pattern)),
}

export function allowedTool(method: string, path: string): boolean {
  // No external URLs, encoded paths, dot segments, fragments or credentials.
  if (!/^\/[a-zA-Z0-9_/?=&.-]+$/.test(path) || path.includes('..') || path.startsWith('//') || path.length > 500) return false
  const pathname = path.split('?')[0]
  if (method !== 'GET' && path.includes('?')) return false
  return (method === 'GET' ? readPaths : writePaths[method] ?? []).some(pattern => pattern.test(pathname))
}

export const actionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(600),
  method: z.enum(['POST', 'PATCH', 'PUT', 'DELETE']),
  path: z.string().max(500),
  body: z.record(z.string(), z.unknown()).default({}),
}).refine(action => allowedTool(action.method, action.path), 'Unsupported workspace action')
export const responseSchema = z.object({
  message: z.string().max(12000).default(''),
  reads: z.array(z.string().max(500)).max(6).default([]),
  actions: z.array(actionSchema).max(5).default([]),
})

/** Dispatch only to known domain routes, with the caller's server-authenticated identity. */
export async function workspaceTool(c: Context<AppContext>, method: string, path: string, body?: Record<string, unknown>): Promise<unknown> {
  if (!allowedTool(method, path)) throw new Error('That workspace operation is not available.')
  if (path.startsWith('/source/')) {
    const url = new URL(path, 'https://workspace.invalid')
    const offset = Math.max(0, Math.min(200000, Number(url.searchParams.get('offset')) || 0))
    const row = await one<{ id: string; title: string; extracted_text: string }>(c.get('db'), 'SELECT id, title, extracted_text FROM study_materials WHERE id = ? AND owner_sub = ?', url.pathname.slice(8), c.get('user').sub)
    if (!row) throw new Error('Source not found in your workspace.')
    return { id: row.id, title: row.title, text: row.extracted_text.slice(offset, offset + 14000), offset, nextOffset: row.extracted_text.length > offset + 14000 ? offset + 14000 : null }
  }
  const router = new Hono<AppContext>()
  router.use('*', async (ctx, next) => {
    ctx.set('user', c.get('user'))
    ctx.set('db', c.get('db'))
    const token = c.get('accessToken')
    if (token) ctx.set('accessToken', token)
    await next()
  })
  router.route('/', profile).route('/', analytics).route('/subjects', subjects).route('/topics', topics)
    .route('/tasks', tasks).route('/sessions', sessions).route('/assessments', assessments)
    .route('/availability', availability).route('/plans', plans).route('/focus', focus).route('/study', study)
  const headers = new Headers({ 'content-type': 'application/json' })
  // Auth mode is used for capabilities; credentials never go to the model.
  const authorization = c.req.header('Authorization')
  if (authorization) headers.set('Authorization', authorization)
  const result = await router.fetch(new Request(new URL(path, c.req.url), { method, headers, ...(method !== 'GET' ? { body: JSON.stringify(body ?? {}) } : {}) }), c.env)
  const envelope = await result.json() as { data?: unknown; success?: boolean; error?: { message?: string } }
  if (!result.ok || envelope.success === false) throw new Error(envelope.error?.message ?? 'The workspace could not complete that operation.')
  const data = envelope.data as Record<string, unknown>
  if (path.split('?')[0] === '/me') return { profile: data.profile, preferences: data.preferences, counts: data.counts }
  if (path.split('?')[0] === '/study/materials') return { items: (data.items as Record<string, unknown>[]).map(({ text, ...item }) => ({ ...item, preview: String(text).slice(0, 250), characters: String(text).length })) }
  return data
}

export const TOOL_GUIDE = `Workspace routes (paths have no /api prefix):
READ GET /me (profile, timezone, preferences), /dashboard, /subjects, /subjects/:id (topics), /tasks?filter=all|archived|completed&subjectId=ID, /tasks/:id/sessions, /assessments, /availability, /sessions?from=UNIX_MS&to=UNIX_MS, /sessions/:id, /analytics?days=7|30, /analytics/subjects/:id, /plans, /plans/active, /focus/active, /study/materials (metadata), /source/:id?offset=0 (14k character text chunks), /study/artifacts, /study/artifacts/:id (content and learning history).
WRITE actions (all must be reviewed and applied by the user):
POST /subjects {name,description?,color?:hex,priority?:low|medium|high,difficulty?:1..5,weeklyTargetMinutes?}; PATCH /subjects/:id same optional fields; DELETE /subjects/:id.
POST /subjects/:id/topics {name,description?,estimatedMinutes?}; PATCH /topics/:id same optional fields and status:not_started|in_progress|completed; DELETE /topics/:id.
POST /tasks {title,subjectId,estimatedMinutes:10..600,topicId?,description?,priority?:low|medium|high,dueAt?:UNIX_MS}; PATCH /tasks/:id optional same fields and status:todo|in_progress|completed|archived,completedMinutes?,confirmRemoveSessions?; DELETE /tasks/:id; POST /tasks/:id/reopen {}.
POST /assessments {title,subjectId,dueAt:UNIX_MS,priority?,description?}; PATCH /assessments/:id optional same fields; DELETE /assessments/:id.
POST /sessions {subjectId,title,startsAt:UNIX_MS,endsAt:UNIX_MS,taskId?}; PATCH /sessions/:id {startsAt?,endsAt?,title?,isLocked?}; DELETE /sessions/:id; POST /sessions/:id/complete {actualMinutes,markTaskComplete?:boolean}; POST /sessions/:id/skip {}.
PUT /availability {rules:[{weekday:1..7,startLocalTime:HH:mm,endLocalTime:HH:mm}]} replaces ALL weekly rules: read first, retain unchanged rules. PUT /availability/overrides {overrides:[{localDate:YYYY-MM-DD,startLocalTime?,endLocalTime?,isUnavailable:boolean}]} replaces all overrides; DELETE /availability/overrides/:id.
PATCH /me {displayName?,academicContext?,learningGoal?,timezone?}; PATCH /me/preferences {preferredSessionMinutes?,breakMinutes?,maxDailyMinutes?,planningHorizonDays?,planningStyle?:balanced|deadline|difficult,theme?:dark|light|system,urgentFirst?}.
POST /plans/generate or /plans/replan {requestId:unique string,startDate?:YYYY-MM-DD,horizonDays?:1..31,subjectIds?,planningStyle?,useAi?:boolean} creates a PROPOSAL only; after applied read /plans then propose POST /plans/:id/accept {} separately. POST /plans/:id/discard {}.
POST /study/generate {kind:flashcards|quiz|notebook,sourceIds:[1..4 existing source ids]}; DELETE /study/materials/:id or /study/artifacts/:id.
POST /focus/start {subjectId?,studySessionId?,plannedMinutes:5..180}; POST /focus/:id/pause {}, /resume {}, /cancel {} (discards time), /finish {completed:boolean,markSessionComplete:boolean} (records time).
You cannot access other users, credentials, accounts, external websites, original file bytes, or upload files. Uploaded sources' extracted text, generated sets, learning history, and workspace data are available. No arbitrary SQL or code. Never invent ids. For dependent changes, propose the first step and wait for its result before proposing the next.`
