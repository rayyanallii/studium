import { Hono } from 'hono'
import { z } from 'zod'

import { exec, id, one } from '../db'
import type { AppContext } from '../env'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { loadAssessments } from '../lib/rows'
import { subjectDirectory, subjectExists, subjectSource } from '../lib/subjects'

export const assessments = new Hono<AppContext>()

const schema = z.object({
  title: z.string().trim().min(1, 'Give the assessment a title.').max(160),
  subjectId: z.string().min(1, 'Choose a subject.'),
  description: z.string().trim().max(1000).nullish(),
  dueAt: z.number().int().positive('Choose a valid date and time.'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

assessments.get('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const items = await loadAssessments(db, user.sub, await subjectDirectory(await subjectSource(c.env, c.get('accessToken'), user), db, user.sub))
  return reply(c, { items })
})

assessments.post('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, schema)
  if (isResponse(parsed)) return parsed
  const subject = await subjectSource(c.env, c.get('accessToken'), user)
  if (!(await subjectExists(subject, db, user.sub, parsed.subjectId))) return fail(c, 422, 'unknown_subject', 'That subject does not exist in your workspace.')

  const now = Date.now()
  const assessmentId = id()
  await exec(
    db,
    'INSERT INTO assessments (id, owner_sub, subject_id, title, description, due_at, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    assessmentId,
    user.sub,
    parsed.subjectId,
    parsed.title,
    parsed.description ?? null,
    parsed.dueAt,
    parsed.priority,
    now,
    now,
  )
  return reply(c, { id: assessmentId, suggestsReplan: true }, 201)
})

assessments.patch('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, schema.partial())
  if (isResponse(parsed)) return parsed
  const assessmentId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM assessments WHERE id = ? AND owner_sub = ?', assessmentId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That assessment no longer exists.')

  const fields: string[] = []
  const params: unknown[] = []
  if (parsed.title !== undefined) {
    fields.push('title = ?')
    params.push(parsed.title)
  }
  if (parsed.subjectId !== undefined) {
    const subject = await subjectSource(c.env, c.get('accessToken'), user)
    if (!(await subjectExists(subject, db, user.sub, parsed.subjectId))) return fail(c, 422, 'unknown_subject', 'That subject does not exist in your workspace.')
    fields.push('subject_id = ?')
    params.push(parsed.subjectId)
  }
  if (parsed.description !== undefined) {
    fields.push('description = ?')
    params.push(parsed.description ?? null)
  }
  if (parsed.dueAt !== undefined) {
    fields.push('due_at = ?')
    params.push(parsed.dueAt)
  }
  if (parsed.priority !== undefined) {
    fields.push('priority = ?')
    params.push(parsed.priority)
  }
  if (fields.length === 0) return reply(c, { updated: false })
  fields.push('updated_at = ?')
  params.push(Date.now(), assessmentId, user.sub)
  await exec(db, `UPDATE assessments SET ${fields.join(', ')} WHERE id = ? AND owner_sub = ?`, ...params)
  return reply(c, { updated: true, suggestsReplan: true })
})

assessments.delete('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const assessmentId = c.req.param('id')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM assessments WHERE id = ? AND owner_sub = ?', assessmentId, user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That assessment no longer exists.')
  await exec(db, 'DELETE FROM assessments WHERE id = ? AND owner_sub = ?', assessmentId, user.sub)
  return reply(c, { deleted: true })
})
