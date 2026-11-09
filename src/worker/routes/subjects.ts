import { Hono } from 'hono'
import { z } from 'zod'

import { exec, id, many, num, one } from '../db'
import type { AppContext } from '../env'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { ensureProfile, loadSubjects } from '../lib/rows'
import type { Topic } from '../../shared/types'

export const subjects = new Hono<AppContext>()

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a valid colour.')

const createSchema = z.object({
  name: z.string().trim().min(1, 'Give the subject a name.').max(80),
  description: z.string().trim().max(400).nullish(),
  color: color.default('#635BFF'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  difficulty: z.number().int().min(1).max(5).default(3),
  weeklyTargetMinutes: z.number().int().min(0).max(3000).nullish(),
})

const updateSchema = createSchema.partial()

subjects.get('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile } = await ensureProfile(db, user)
  const items = await loadSubjects(db, user.sub, profile.timezone, Date.now())
  return reply(c, { items })
})

subjects.post('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, createSchema)
  if (isResponse(parsed)) return parsed
  const existing = await one<{ n: number }>(db, 'SELECT COUNT(*) AS n FROM subjects WHERE owner_sub = ? AND deleted_at IS NULL', user.sub)
  if (num(existing?.n) >= 40) return fail(c, 409, 'subject_limit', 'Forty subjects is the limit for one workspace.')

  const now = Date.now()
  const subjectId = id()
  await exec(
    db,
    'INSERT INTO subjects (id, owner_sub, name, description, color, priority, difficulty, weekly_target_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    subjectId,
    user.sub,
    parsed.name,
    parsed.description ?? null,
    parsed.color,
    parsed.priority,
    parsed.difficulty,
    parsed.weeklyTargetMinutes ?? null,
    now,
    now,
  )
  return reply(c, { id: subjectId }, 201)
})

subjects.get('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile } = await ensureProfile(db, user)
  const subjectId = c.req.param('id')
  const items = await loadSubjects(db, user.sub, profile.timezone, Date.now())
  const subject = items.find((item) => item.id === subjectId)
  if (!subject) return fail(c, 404, 'not_found', 'That subject no longer exists.')

  const topics = await many<{ id: string; subject_id: string; name: string; description: string | null; estimated_minutes: number | null; status: string; created_at: number; updated_at: number }>(
    db,
    'SELECT * FROM topics WHERE owner_sub = ? AND subject_id = ? ORDER BY created_at',
    user.sub,
    subjectId,
  )
  const mapped: Topic[] = topics.map((row) => ({
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    description: row.description,
    estimatedMinutes: row.estimated_minutes === null ? null : Number(row.estimated_minutes),
    status: row.status as Topic['status'],
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }))
  return reply(c, { subject, topics: mapped })
})

subjects.patch('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, updateSchema)
  if (isResponse(parsed)) return parsed
  const subjectId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM subjects WHERE id = ? AND owner_sub = ? AND deleted_at IS NULL', subjectId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That subject no longer exists.')

  const fields: string[] = []
  const params: unknown[] = []
  const assign = (column: string, value: unknown) => {
    fields.push(`${column} = ?`)
    params.push(value)
  }
  if (parsed.name !== undefined) assign('name', parsed.name)
  if (parsed.description !== undefined) assign('description', parsed.description ?? null)
  if (parsed.color !== undefined) assign('color', parsed.color)
  if (parsed.priority !== undefined) assign('priority', parsed.priority)
  if (parsed.difficulty !== undefined) assign('difficulty', parsed.difficulty)
  if (parsed.weeklyTargetMinutes !== undefined) assign('weekly_target_minutes', parsed.weeklyTargetMinutes ?? null)
  if (fields.length === 0) return reply(c, { updated: false })

  assign('updated_at', Date.now())
  params.push(subjectId, user.sub)
  await exec(db, `UPDATE subjects SET ${fields.join(', ')} WHERE id = ? AND owner_sub = ?`, ...params)
  return reply(c, { updated: true })
})

subjects.delete('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const subjectId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM subjects WHERE id = ? AND owner_sub = ? AND deleted_at IS NULL', subjectId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That subject no longer exists.')
  const now = Date.now()

  // History is preserved: completed sessions keep their subject row, which is
  // soft-deleted. Open work and future plans for the subject are removed.
  await db.batch([
    db.prepare("DELETE FROM study_sessions WHERE owner_sub = ? AND subject_id = ? AND status = 'planned' AND is_locked = 0 AND starts_at > ?").bind(user.sub, subjectId, now),
    db.prepare('UPDATE study_sessions SET task_id = NULL WHERE owner_sub = ? AND subject_id = ?').bind(user.sub, subjectId),
    db.prepare('DELETE FROM tasks WHERE owner_sub = ? AND subject_id = ?').bind(user.sub, subjectId),
    db.prepare('DELETE FROM topics WHERE owner_sub = ? AND subject_id = ?').bind(user.sub, subjectId),
    db.prepare('DELETE FROM assessments WHERE owner_sub = ? AND subject_id = ?').bind(user.sub, subjectId),
    db.prepare('UPDATE subjects SET deleted_at = ?, updated_at = ? WHERE id = ? AND owner_sub = ?').bind(now, now, subjectId, user.sub),
  ])
  return reply(c, { deleted: true })
})

const topicSchema = z.object({
  name: z.string().trim().min(1, 'Give the topic a name.').max(120),
  description: z.string().trim().max(600).nullish(),
  estimatedMinutes: z.number().int().min(0).max(3000).nullish(),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
})

subjects.post('/:id/topics', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, topicSchema)
  if (isResponse(parsed)) return parsed
  const subjectId = c.req.param('id')
  const subject = await one<{ id: string }>(db, 'SELECT id FROM subjects WHERE id = ? AND owner_sub = ? AND deleted_at IS NULL', subjectId, user.sub)
  if (!subject) return fail(c, 404, 'not_found', 'That subject no longer exists.')

  const now = Date.now()
  const topicId = id()
  await exec(
    db,
    'INSERT INTO topics (id, owner_sub, subject_id, name, description, estimated_minutes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    topicId,
    user.sub,
    subjectId,
    parsed.name,
    parsed.description ?? null,
    parsed.estimatedMinutes ?? null,
    parsed.status,
    now,
    now,
  )
  return reply(c, { id: topicId }, 201)
})

export const topics = new Hono<AppContext>()

topics.patch('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, topicSchema.partial())
  if (isResponse(parsed)) return parsed
  const topicId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM topics WHERE id = ? AND owner_sub = ?', topicId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That topic no longer exists.')

  const fields: string[] = []
  const params: unknown[] = []
  if (parsed.name !== undefined) {
    fields.push('name = ?')
    params.push(parsed.name)
  }
  if (parsed.description !== undefined) {
    fields.push('description = ?')
    params.push(parsed.description ?? null)
  }
  if (parsed.estimatedMinutes !== undefined) {
    fields.push('estimated_minutes = ?')
    params.push(parsed.estimatedMinutes ?? null)
  }
  if (parsed.status !== undefined) {
    fields.push('status = ?')
    params.push(parsed.status)
  }
  if (fields.length === 0) return reply(c, { updated: false })
  fields.push('updated_at = ?')
  params.push(Date.now(), topicId, user.sub)
  await exec(db, `UPDATE topics SET ${fields.join(', ')} WHERE id = ? AND owner_sub = ?`, ...params)
  return reply(c, { updated: true })
})

topics.delete('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const topicId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM topics WHERE id = ? AND owner_sub = ?', topicId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That topic no longer exists.')
  await db.batch([
    db.prepare('UPDATE tasks SET topic_id = NULL WHERE owner_sub = ? AND topic_id = ?').bind(user.sub, topicId),
    db.prepare('DELETE FROM topics WHERE id = ? AND owner_sub = ?').bind(topicId, user.sub),
  ])
  return reply(c, { deleted: true })
})
