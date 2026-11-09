import { Hono, type Context } from 'hono'
import { z } from 'zod'

import { exec, id, num, one } from '../db'
import type { AppContext } from '../env'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { ensureProfile, loadSession } from '../lib/rows'
import type { FocusRun } from '../../shared/types'

export const focus = new Hono<AppContext>()

type FocusRow = {
  id: string
  study_session_id: string | null
  subject_id: string | null
  task_id: string | null
  started_at: number
  ended_at: number | null
  planned_seconds: number
  accumulated_focus_seconds: number
  last_resumed_at: number | null
  status: string
  subject_name?: string | null
  subject_color?: string | null
  session_title?: string | null
}

/** Elapsed time is derived from timestamps, so a backgrounded tab stays exact. */
function elapsedSeconds(row: FocusRow, now: number): number {
  const base = num(row.accumulated_focus_seconds)
  if (row.status !== 'running' || !row.last_resumed_at) return base
  return base + Math.max(0, Math.floor((now - num(row.last_resumed_at)) / 1000))
}

async function loadRun(db: D1Database, ownerSub: string, runId: string): Promise<FocusRun | null> {
  const row = await one<FocusRow>(
    db,
    `SELECT f.*, s.name AS subject_name, s.color AS subject_color
     FROM focus_runs f LEFT JOIN subjects s ON s.id = f.subject_id AND s.owner_sub = f.owner_sub
     WHERE f.owner_sub = ? AND f.id = ?`,
    ownerSub,
    runId,
  )
  if (!row) return null
  const session = row.study_session_id
    ? await one<{ title: string }>(db, 'SELECT title FROM study_sessions WHERE id = ? AND owner_sub = ?', row.study_session_id, ownerSub)
    : null
  return {
    id: row.id,
    studySessionId: row.study_session_id,
    subjectId: row.subject_id,
    startedAt: num(row.started_at),
    endedAt: row.ended_at === null ? null : num(row.ended_at),
    plannedSeconds: num(row.planned_seconds),
    accumulatedFocusSeconds: num(row.accumulated_focus_seconds),
    lastResumedAt: row.last_resumed_at === null ? null : num(row.last_resumed_at),
    status: row.status as FocusRun['status'],
    elapsedSeconds: elapsedSeconds(row, Date.now()),
    subjectName: row.subject_name ?? null,
    subjectColor: row.subject_color ?? null,
    sessionTitle: session?.title ?? null,
    taskId: row.task_id,
  }
}

focus.get('/active', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const row = await one<FocusRow>(
    db,
    `SELECT f.*, s.name AS subject_name, s.color AS subject_color
     FROM focus_runs f LEFT JOIN subjects s ON s.id = f.subject_id AND s.owner_sub = f.owner_sub
     WHERE f.owner_sub = ? AND f.status IN ('running','paused') ORDER BY f.started_at DESC LIMIT 1`,
    user.sub,
  )
  return reply(c, { run: row ? await loadRun(db, user.sub, row.id) : null })
})

const startSchema = z.object({
  studySessionId: z.string().nullish(),
  subjectId: z.string().nullish(),
  plannedMinutes: z.number().int().min(5).max(180).default(25),
})

focus.post('/start', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, startSchema)
  if (isResponse(parsed)) return parsed
  await ensureProfile(db, user)

  const open = await one<{ id: string }>(
    db,
    "SELECT id FROM focus_runs WHERE owner_sub = ? AND status IN ('running','paused') ORDER BY started_at DESC LIMIT 1",
    user.sub,
  )
  if (open) {
    return reply(c, { run: await loadRun(db, user.sub, open.id), resumed: true }, 200)
  }

  let subjectId = parsed.subjectId ?? null
  let taskId: string | null = null
  let sessionTitle: string | null = null
  if (parsed.studySessionId) {
    const session = await loadSession(db, user.sub, parsed.studySessionId)
    if (!session) return fail(c, 404, 'not_found', 'That study session no longer exists.')
    if (session.status === 'completed') return fail(c, 409, 'already_completed', 'That session is already complete.')
    subjectId = session.subjectId
    taskId = session.taskId
    sessionTitle = session.title
    await exec(db, "UPDATE study_sessions SET status = 'in_progress', updated_at = ? WHERE id = ? AND owner_sub = ?", Date.now(), session.id, user.sub)
  }
  if (subjectId) {
    const subject = await one<{ id: string }>(db, 'SELECT id FROM subjects WHERE id = ? AND owner_sub = ?', subjectId, user.sub)
    if (!subject) return fail(c, 422, 'unknown_subject', 'That subject does not exist in your workspace.')
  } else if (!parsed.studySessionId) {
    return fail(c, 422, 'missing_subject', 'Choose a subject to focus on.')
  }

  const now = Date.now()
  const runId = id()
  await exec(
    db,
    `INSERT INTO focus_runs (id, owner_sub, study_session_id, subject_id, task_id, started_at, planned_seconds, accumulated_focus_seconds, last_resumed_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'running', ?)`,
    runId,
    user.sub,
    parsed.studySessionId ?? null,
    subjectId,
    taskId,
    now,
    parsed.plannedMinutes * 60,
    now,
    now,
  )
  const run = await loadRun(db, user.sub, runId)
  return reply(c, { run, sessionTitle }, 201)
})

async function transition(c: Context<AppContext>, action: 'pause' | 'resume' | 'finish', body?: { completed?: boolean; markSessionComplete?: boolean; actualMinutes?: number }) {
  const user = c.get('user')
  const db = c.get('db')
  const runId = c.req.param('id')!
  const row = await one<FocusRow>(db, 'SELECT * FROM focus_runs WHERE id = ? AND owner_sub = ?', runId, user.sub)
  if (!row) return fail(c, 404, 'not_found', 'That focus session no longer exists.')
  const now = Date.now()

  if (action === 'finish' && (row.status === 'completed' || row.status === 'abandoned')) {
    // Idempotent: finishing twice never double-counts study minutes.
    return reply(c, { run: await loadRun(db, user.sub, runId) })
  }
  if (row.status === 'completed' || row.status === 'abandoned') {
    return fail(c, 409, 'run_closed', 'That focus session has already ended.')
  }

  const current = elapsedSeconds(row, now)

  if (action === 'pause') {
    if (row.status === 'paused') return reply(c, { run: await loadRun(db, user.sub, runId) })
    await exec(db, "UPDATE focus_runs SET accumulated_focus_seconds = ?, last_resumed_at = NULL, status = 'paused' WHERE id = ? AND owner_sub = ?", current, runId, user.sub)
    return reply(c, { run: await loadRun(db, user.sub, runId) })
  }

  if (action === 'resume') {
    if (row.status === 'running') return reply(c, { run: await loadRun(db, user.sub, runId) })
    await exec(db, "UPDATE focus_runs SET last_resumed_at = ?, status = 'running' WHERE id = ? AND owner_sub = ?", now, runId, user.sub)
    return reply(c, { run: await loadRun(db, user.sub, runId) })
  }

  // finish
  const completed = body?.completed ?? true
  const focused = Math.max(0, Math.floor(body?.actualMinutes ? body.actualMinutes * 60 : current))
  const minutes = Math.floor(focused / 60)
  await exec(
    db,
    "UPDATE focus_runs SET accumulated_focus_seconds = ?, last_resumed_at = NULL, ended_at = ?, status = ? WHERE id = ? AND owner_sub = ?",
    focused,
    now,
    completed ? 'completed' : 'abandoned',
    runId,
    user.sub,
  )

  let session = row.study_session_id ? await loadSession(db, user.sub, row.study_session_id) : null
  if (row.study_session_id && minutes > 0) {
    // Append once per finished run; this is the only place actual study minutes grow.
    const markComplete = body?.markSessionComplete ?? (completed && focused >= num(row.planned_seconds) * 0.9)
    const statements: D1PreparedStatement[] = [
      db
        .prepare("UPDATE study_sessions SET actual_minutes = actual_minutes + ?, status = ?, completed_at = ?, updated_at = ? WHERE id = ? AND owner_sub = ?")
        .bind(minutes, markComplete ? 'completed' : 'in_progress', markComplete ? now : null, now, row.study_session_id, user.sub),
    ]
    if (markComplete && row.task_id) {
      statements.push(
        db.prepare("UPDATE tasks SET completed_minutes = MIN(estimated_minutes, completed_minutes + ?), updated_at = ? WHERE id = ? AND owner_sub = ?").bind(minutes, now, row.task_id, user.sub),
      )
    }
    await db.batch(statements)
    session = await loadSession(db, user.sub, row.study_session_id)
  }

  return reply(c, { run: await loadRun(db, user.sub, runId), session, recordedMinutes: minutes })
}

focus.post('/:id/pause', (c) => transition(c, 'pause'))

focus.post('/:id/resume', (c) => transition(c, 'resume'))

focus.post('/:id/finish', async (c) => {
  const parsed = await parseBody(
    c,
    z.object({
      completed: z.boolean().optional(),
      markSessionComplete: z.boolean().optional(),
      actualMinutes: z.number().min(0).max(240).optional(),
    }),
  )
  if (isResponse(parsed)) return parsed
  return transition(c, 'finish', parsed)
})

focus.post('/:id/abandon', (c) => transition(c, 'finish', { completed: false }))
