import { Hono, type Context } from 'hono'
import { z } from 'zod'

import { exec, id, num, one } from '../db'
import type { AppContext } from '../env'
import { suggestSlots, slotProblem } from '../lib/availability'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { ensureProfile, loadSession, loadSessions } from '../lib/rows'

export const sessions = new Hono<AppContext>()

async function validateLinks(db: D1Database, ownerSub: string, subjectId: string, taskId: string | null | undefined) {
  const subject = await one<{ id: string }>(db, 'SELECT id FROM subjects WHERE id = ? AND owner_sub = ? AND deleted_at IS NULL', subjectId, ownerSub)
  if (!subject) return 'That subject does not exist in your workspace.'
  if (taskId) {
    const task = await one<{ id: string }>(db, 'SELECT id FROM tasks WHERE id = ? AND owner_sub = ? AND subject_id = ?', taskId, ownerSub, subjectId)
    if (!task) return 'That task does not belong to the chosen subject.'
  }
  return null
}

async function conflictResponse(c: Context<AppContext>, message: string, durationMinutes: number, afterMs: number) {
  const user = c.get('user')
  const db = c.get('db')
  const { profile } = await ensureProfile(db, user)
  const alternatives = await suggestSlots(db, user.sub, profile.timezone, durationMinutes, afterMs)
  return c.json(
    {
      success: false,
      error: {
        code: 'scheduling_conflict',
        message,
        details: { alternatives },
      },
    },
    409,
  )
}

sessions.get('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const now = Date.now()
  const from = Number(c.req.query('from'))
  const to = Number(c.req.query('to'))
  const items = await loadSessions(db, user.sub, {
    from: Number.isFinite(from) && from > 0 ? from : now - 7 * 86_400_000,
    to: Number.isFinite(to) && to > 0 ? to : now + 45 * 86_400_000,
    subjectId: c.req.query('subjectId') || undefined,
  })
  return reply(c, { items })
})

const createSchema = z.object({
  subjectId: z.string().min(1),
  taskId: z.string().nullish(),
  title: z.string().trim().max(160).nullish(),
  startsAt: z.number().int().positive(),
  endsAt: z.number().int().positive(),
})

sessions.post('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, createSchema)
  if (isResponse(parsed)) return parsed
  const { profile } = await ensureProfile(db, user)

  const linkProblem = await validateLinks(db, user.sub, parsed.subjectId, parsed.taskId)
  if (linkProblem) return fail(c, 422, 'invalid_link', linkProblem)

  const problem = await slotProblem(db, user.sub, profile.timezone, parsed.startsAt, parsed.endsAt)
  if (problem) return conflictResponse(c, problem, Math.max(10, Math.round((parsed.endsAt - parsed.startsAt) / 60_000)), parsed.startsAt)

  let title = parsed.title?.trim()
  if (!title && parsed.taskId) {
    const task = await one<{ title: string }>(db, 'SELECT title FROM tasks WHERE id = ? AND owner_sub = ?', parsed.taskId, user.sub)
    title = task?.title
  }
  if (!title) return fail(c, 422, 'missing_title', 'Give the session a title or link it to a task.')

  const now = Date.now()
  const sessionId = id()
  // Manual sessions are locked so future replans never move them.
  await exec(
    db,
    `INSERT INTO study_sessions (id, owner_sub, plan_id, subject_id, task_id, title, starts_at, ends_at, planned_minutes, actual_minutes, status, is_locked, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 0, 'planned', 1, ?, ?)`,
    sessionId,
    user.sub,
    parsed.subjectId,
    parsed.taskId ?? null,
    title.slice(0, 160),
    parsed.startsAt,
    parsed.endsAt,
    Math.max(1, Math.round((parsed.endsAt - parsed.startsAt) / 60_000)),
    now,
    now,
  )
  return reply(c, { session: await loadSession(db, user.sub, sessionId) }, 201)
})

const updateSchema = z.object({
  startsAt: z.number().int().positive().optional(),
  endsAt: z.number().int().positive().optional(),
  title: z.string().trim().min(1).max(160).optional(),
  taskId: z.string().nullish(),
  isLocked: z.boolean().optional(),
})

sessions.patch('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, updateSchema)
  if (isResponse(parsed)) return parsed
  const sessionId = c.req.param('id')
  const existing = await loadSession(db, user.sub, sessionId)
  if (!existing) return fail(c, 404, 'not_found', 'That study session no longer exists.')
  if (existing.status === 'completed' && (parsed.startsAt || parsed.endsAt)) {
    return fail(c, 409, 'already_completed', 'Completed sessions keep their recorded time.')
  }
  const { profile } = await ensureProfile(db, user)

  const startsAt = parsed.startsAt ?? existing.startsAt
  const endsAt = parsed.endsAt ?? existing.endsAt
  const timeChanged = startsAt !== existing.startsAt || endsAt !== existing.endsAt
  if (timeChanged) {
    const problem = await slotProblem(db, user.sub, profile.timezone, startsAt, endsAt, sessionId)
    if (problem) return conflictResponse(c, problem, Math.max(10, Math.round((endsAt - startsAt) / 60_000)), startsAt)
  }
  if (parsed.taskId) {
    const linkProblem = await validateLinks(db, user.sub, existing.subjectId, parsed.taskId)
    if (linkProblem) return fail(c, 422, 'invalid_link', linkProblem)
  }

  const fields: string[] = []
  const params: unknown[] = []
  const assign = (column: string, value: unknown) => {
    fields.push(`${column} = ?`)
    params.push(value)
  }
  if (timeChanged) {
    assign('starts_at', startsAt)
    assign('ends_at', endsAt)
    assign('planned_minutes', Math.max(1, Math.round((endsAt - startsAt) / 60_000)))
    assign('is_locked', 1)
  }
  if (parsed.title !== undefined) assign('title', parsed.title)
  if (parsed.taskId !== undefined) assign('task_id', parsed.taskId ?? null)
  if (parsed.isLocked !== undefined) assign('is_locked', parsed.isLocked ? 1 : 0)
  if (fields.length === 0) return reply(c, { session: existing })
  assign('updated_at', Date.now())
  params.push(sessionId, user.sub)
  await exec(db, `UPDATE study_sessions SET ${fields.join(', ')} WHERE id = ? AND owner_sub = ?`, ...params)
  return reply(c, { session: await loadSession(db, user.sub, sessionId) })
})

const completeSchema = z.object({
  actualMinutes: z.number().int().min(0).max(600).optional(),
  markTaskComplete: z.boolean().optional(),
})

sessions.post('/:id/complete', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, completeSchema)
  if (isResponse(parsed)) return parsed
  const sessionId = c.req.param('id')
  const existing = await loadSession(db, user.sub, sessionId)
  if (!existing) return fail(c, 404, 'not_found', 'That study session no longer exists.')

  const now = Date.now()
  const recorded = Math.max(existing.actualMinutes, parsed.actualMinutes ?? existing.plannedMinutes)
  const statements: D1PreparedStatement[] = [
    db
      .prepare("UPDATE study_sessions SET status = 'completed', completed_at = ?, actual_minutes = ?, updated_at = ? WHERE id = ? AND owner_sub = ?")
      .bind(now, recorded, now, sessionId, user.sub),
  ]
  if (existing.taskId) {
    statements.push(
      db
        .prepare('UPDATE tasks SET completed_minutes = MIN(estimated_minutes, completed_minutes + ?), updated_at = ? WHERE id = ? AND owner_sub = ?')
        .bind(Math.round((recorded - existing.actualMinutes) > 0 ? recorded - existing.actualMinutes : 0), now, existing.taskId, user.sub),
    )
    if (parsed.markTaskComplete) {
      statements.push(
        db
          .prepare("UPDATE tasks SET status = 'completed', completed_minutes = estimated_minutes, updated_at = ? WHERE id = ? AND owner_sub = ?")
          .bind(now, existing.taskId, user.sub),
      )
    }
  }
  await db.batch(statements)
  return reply(c, { session: await loadSession(db, user.sub, sessionId) })
})

sessions.post('/:id/skip', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const sessionId = c.req.param('id')
  const existing = await loadSession(db, user.sub, sessionId)
  if (!existing) return fail(c, 404, 'not_found', 'That study session no longer exists.')
  if (existing.status === 'completed') return fail(c, 409, 'already_completed', 'Completed sessions cannot be skipped.')
  await exec(db, "UPDATE study_sessions SET status = 'skipped', updated_at = ? WHERE id = ? AND owner_sub = ?", Date.now(), sessionId, user.sub)
  return reply(c, { session: await loadSession(db, user.sub, sessionId), suggestsReplan: true })
})

sessions.delete('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const sessionId = c.req.param('id')
  const existing = await loadSession(db, user.sub, sessionId)
  if (!existing) return fail(c, 404, 'not_found', 'That study session no longer exists.')
  if (existing.status === 'completed') return fail(c, 409, 'already_completed', 'Completed sessions are part of your study history and cannot be deleted.')
  await exec(db, 'DELETE FROM study_sessions WHERE id = ? AND owner_sub = ?', sessionId, user.sub)
  return reply(c, { deleted: true })
})

/** Sessions for one calendar range plus the totals the header shows. */
sessions.get('/summary', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const now = Date.now()
  const from = Number(c.req.query('from'))
  const to = Number(c.req.query('to'))
  const items = await loadSessions(db, user.sub, {
    from: Number.isFinite(from) && from > 0 ? from : now - 86_400_000,
    to: Number.isFinite(to) && to > 0 ? to : now + 7 * 86_400_000,
  })
  return reply(c, {
    items,
    totals: {
      plannedMinutes: items.reduce((sum, s) => sum + s.plannedMinutes, 0),
      completedMinutes: items.reduce((sum, s) => sum + s.actualMinutes, 0),
      completed: items.filter((s) => s.status === 'completed').length,
      missed: items.filter((s) => s.status === 'missed' || s.status === 'skipped').length,
      count: items.length,
    },
  })
})

sessions.get('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const session = await loadSession(db, user.sub, c.req.param('id'))
  if (!session) return fail(c, 404, 'not_found', 'That study session no longer exists.')
  const runs = await c.get('db').prepare('SELECT COUNT(*) AS n FROM focus_runs WHERE owner_sub = ? AND study_session_id = ?').bind(user.sub, session.id).first<{ n: number }>()
  return reply(c, { session, focusRuns: num(runs?.n) })
})
