import { Hono } from 'hono'
import { z } from 'zod'

import { exec, id, many, num, one } from '../db'
import type { AppContext } from '../env'
import { dayBounds, localDate } from '../lib/dates'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { ensureProfile, loadTask, loadTasks } from '../lib/rows'

export const tasks = new Hono<AppContext>()

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Give the task a title.').max(160),
  subjectId: z.string().min(1, 'Choose a subject.'),
  topicId: z.string().nullish(),
  description: z.string().trim().max(1000).nullish(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueAt: z.number().int().positive().nullish(),
  estimatedMinutes: z.number().int().min(10, 'Estimates start at 10 minutes.').max(600, 'Keep estimates under 10 hours.'),
})

const updateSchema = taskSchema.partial().extend({
  status: z.enum(['todo', 'in_progress', 'completed', 'archived']).optional(),
  completedMinutes: z.number().int().min(0).max(10000).optional(),
  confirmRemoveSessions: z.boolean().optional(),
})

const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }

tasks.get('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile } = await ensureProfile(db, user)
  const now = Date.now()
  const today = localDate(now, profile.timezone)
  const bounds = dayBounds(today, profile.timezone)

  let items = await loadTasks(db, user.sub, now)
  const filter = c.req.query('filter') ?? 'all'
  const subjectId = c.req.query('subjectId')
  const priority = c.req.query('priority')
  const status = c.req.query('status')
  const sort = c.req.query('sort') ?? 'due'

  if (filter === 'today') items = items.filter((t) => t.dueAt !== null && t.dueAt >= bounds.start && t.dueAt < bounds.end && t.status !== 'archived')
  else if (filter === 'upcoming') items = items.filter((t) => t.dueAt !== null && t.dueAt >= bounds.end && t.status !== 'archived')
  else if (filter === 'overdue') items = items.filter((t) => t.dueAt !== null && t.dueAt < now && t.status !== 'completed' && t.status !== 'archived')
  else if (filter === 'completed') items = items.filter((t) => t.status === 'completed')
  else if (filter === 'archived') items = items.filter((t) => t.status === 'archived')
  else items = items.filter((t) => t.status !== 'archived')

  if (subjectId) items = items.filter((t) => t.subjectId === subjectId)
  if (priority) items = items.filter((t) => t.priority === priority)
  if (status) items = items.filter((t) => t.status === status)

  items.sort((a, b) => {
    if (sort === 'priority') return priorityRank[a.priority] - priorityRank[b.priority] || (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity)
    if (sort === 'created') return b.createdAt - a.createdAt
    const aDue = a.dueAt ?? Number.MAX_SAFE_INTEGER
    const bDue = b.dueAt ?? Number.MAX_SAFE_INTEGER
    return aDue - bDue || priorityRank[a.priority] - priorityRank[b.priority]
  })

  const open = items.filter((t) => t.status === 'todo' || t.status === 'in_progress')
  return reply(c, {
    items: items.slice(0, 300),
    counts: {
      open: open.length,
      overdue: open.filter((t) => t.dueAt !== null && t.dueAt < now).length,
      completed: items.filter((t) => t.status === 'completed').length,
    },
  })
})

tasks.post('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, taskSchema)
  if (isResponse(parsed)) return parsed

  const subject = await one<{ id: string }>(db, 'SELECT id FROM subjects WHERE id = ? AND owner_sub = ? AND deleted_at IS NULL', parsed.subjectId, user.sub)
  if (!subject) return fail(c, 422, 'unknown_subject', 'That subject does not exist in your workspace.')
  if (parsed.topicId) {
    const topic = await one<{ id: string }>(db, 'SELECT id FROM topics WHERE id = ? AND owner_sub = ? AND subject_id = ?', parsed.topicId, user.sub, parsed.subjectId)
    if (!topic) return fail(c, 422, 'unknown_topic', 'That topic does not belong to the chosen subject.')
  }

  const now = Date.now()
  const taskId = id()
  await exec(
    db,
    `INSERT INTO tasks (id, owner_sub, subject_id, topic_id, title, description, priority, status, due_at, estimated_minutes, completed_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', ?, ?, 0, ?, ?)`,
    taskId,
    user.sub,
    parsed.subjectId,
    parsed.topicId ?? null,
    parsed.title,
    parsed.description ?? null,
    parsed.priority,
    parsed.dueAt ?? null,
    parsed.estimatedMinutes,
    now,
    now,
  )
  const task = await loadTask(db, user.sub, taskId, now)
  return reply(c, { task }, 201)
})

tasks.patch('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, updateSchema)
  if (isResponse(parsed)) return parsed
  const taskId = c.req.param('id')
  const existing = await one<{ id: string; status: string; subject_id: string; estimated_minutes: number }>(
    db,
    'SELECT id, status, subject_id, estimated_minutes FROM tasks WHERE id = ? AND owner_sub = ?',
    taskId,
    user.sub,
  )
  if (!existing) return fail(c, 404, 'not_found', 'That task no longer exists.')

  if (parsed.subjectId) {
    const subject = await one<{ id: string }>(db, 'SELECT id FROM subjects WHERE id = ? AND owner_sub = ? AND deleted_at IS NULL', parsed.subjectId, user.sub)
    if (!subject) return fail(c, 422, 'unknown_subject', 'That subject does not exist in your workspace.')
  }
  if (parsed.topicId) {
    const topic = await one<{ id: string }>(db, 'SELECT id FROM topics WHERE id = ? AND owner_sub = ?', parsed.topicId, user.sub)
    if (!topic) return fail(c, 422, 'unknown_topic', 'That topic does not exist in your workspace.')
  }

  const now = Date.now()
  const completing = parsed.status === 'completed' && existing.status !== 'completed'
  if (completing) {
    const upcoming = await one<{ n: number }>(
      db,
      "SELECT COUNT(*) AS n FROM study_sessions WHERE owner_sub = ? AND task_id = ? AND status = 'planned' AND starts_at > ?",
      user.sub,
      taskId,
      now,
    )
    const count = num(upcoming?.n)
    if (count > 0 && !parsed.confirmRemoveSessions) {
      return c.json(
        {
          success: false,
          error: {
            code: 'sessions_exist',
            message: `This task still has ${count} upcoming ${count === 1 ? 'session' : 'sessions'}. Confirm to remove them from the plan.`,
            details: { futureSessions: count },
          },
        } as never,
        409 as never,
      )
    }
    if (count > 0) await exec(db, "DELETE FROM study_sessions WHERE owner_sub = ? AND task_id = ? AND status = 'planned'", user.sub, taskId)
  }

  const fields: string[] = []
  const params: unknown[] = []
  const assign = (column: string, value: unknown) => {
    fields.push(`${column} = ?`)
    params.push(value)
  }
  if (parsed.title !== undefined) assign('title', parsed.title)
  if (parsed.subjectId !== undefined) assign('subject_id', parsed.subjectId)
  if (parsed.topicId !== undefined) assign('topic_id', parsed.topicId ?? null)
  if (parsed.description !== undefined) assign('description', parsed.description ?? null)
  if (parsed.priority !== undefined) assign('priority', parsed.priority)
  if (parsed.dueAt !== undefined) assign('due_at', parsed.dueAt ?? null)
  if (parsed.estimatedMinutes !== undefined) assign('estimated_minutes', parsed.estimatedMinutes)
  if (parsed.completedMinutes !== undefined) assign('completed_minutes', parsed.completedMinutes)
  if (parsed.status !== undefined) {
    assign('status', parsed.status)
    if (parsed.status === 'completed') {
      assign('completed_minutes', parsed.estimatedMinutes ?? existing.estimated_minutes)
    }
    if (parsed.status === 'todo') assign('completed_minutes', 0)
  }
  if (fields.length === 0) return reply(c, { updated: false })
  assign('updated_at', now)
  params.push(taskId, user.sub)
  await exec(db, `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND owner_sub = ?`, ...params)

  const task = await loadTask(db, user.sub, taskId, now)
  return reply(c, { task })
})

tasks.delete('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const taskId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM tasks WHERE id = ? AND owner_sub = ?', taskId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That task no longer exists.')
  await db.batch([
    // Keep study history, but drop the dangling reference.
    db.prepare('UPDATE study_sessions SET task_id = NULL WHERE owner_sub = ? AND task_id = ?').bind(user.sub, taskId),
    db.prepare('DELETE FROM tasks WHERE id = ? AND owner_sub = ?').bind(taskId, user.sub),
  ])
  return reply(c, { deleted: true })
})

tasks.post('/:id/reopen', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const taskId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM tasks WHERE id = ? AND owner_sub = ?', taskId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That task no longer exists.')
  await exec(db, "UPDATE tasks SET status = 'todo', completed_minutes = 0, updated_at = ? WHERE id = ? AND owner_sub = ?", Date.now(), taskId, user.sub)
  const task = await loadTask(db, user.sub, taskId, Date.now())
  return reply(c, { task })
})

/** Session links for a task, so the task table can show what is already planned. */
tasks.get('/:id/sessions', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const taskId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM tasks WHERE id = ? AND owner_sub = ?', taskId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That task no longer exists.')
  const rows = await many<{ id: string; title: string; starts_at: number; ends_at: number; status: string; planned_minutes: number; actual_minutes: number; subject_id: string; subject_name: string; subject_color: string }>(
    db,
    `SELECT ss.id, ss.title, ss.starts_at, ss.ends_at, ss.status, ss.planned_minutes, ss.actual_minutes, ss.subject_id, s.name AS subject_name, s.color AS subject_color
     FROM study_sessions ss JOIN subjects s ON s.id = ss.subject_id
     WHERE ss.owner_sub = ? AND ss.task_id = ? ORDER BY ss.starts_at`,
    user.sub,
    taskId,
  )
  return reply(c, {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      startsAt: Number(row.starts_at),
      endsAt: Number(row.ends_at),
      status: row.status,
      plannedMinutes: Number(row.planned_minutes),
      actualMinutes: Number(row.actual_minutes),
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      subjectColor: row.subject_color,
    })),
  })
})
