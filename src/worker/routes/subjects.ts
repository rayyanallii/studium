import { Hono } from 'hono'
import { z } from 'zod'

import type { AppContext } from '../env'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { ensureProfile } from '../lib/rows'
import { createTopic, deleteTopic, listTopics, loadSubjects, subjectExists, subjectSource, subjectRecords, updateTopic } from '../lib/subjects'
import { toWorkspaceError } from '../lib/pg'

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
  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    const items = await loadSubjects(db, user.sub, profile.timezone, Date.now(), source)
    return reply(c, { items })
  } catch (error) {
    return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not load your subjects.')
  }
})

subjects.post('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, createSchema)
  if (isResponse(parsed)) return parsed

  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    const existing = await subjectRecords(source, db, user.sub)
    if (existing.length >= 40) return fail(c, 409, 'subject_limit', 'Forty subjects is the limit for one workspace.')

    const subjectId = crypto.randomUUID()
    if (source.pg && source.workspaceId) {
      const { error } = await source.pg.from('subjects').insert({
        id: subjectId,
        workspace_id: source.workspaceId,
        name: parsed.name,
        description: parsed.description ?? null,
        color: parsed.color,
        priority: parsed.priority,
        difficulty: parsed.difficulty,
        weekly_target_minutes: parsed.weeklyTargetMinutes ?? null,
      })
      if (error) throw toWorkspaceError(error)
    } else {
      const now = Date.now()
      await db
        .prepare(
          'INSERT INTO subjects (id, owner_sub, name, description, color, priority, difficulty, weekly_target_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(subjectId, user.sub, parsed.name, parsed.description ?? null, parsed.color, parsed.priority, parsed.difficulty, parsed.weeklyTargetMinutes ?? null, now, now)
        .run()
    }
    return reply(c, { id: subjectId }, 201)
  } catch (error) {
    return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not add the subject.')
  }
})

subjects.get('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile } = await ensureProfile(db, user)
  const subjectId = c.req.param('id')
  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    const items = await loadSubjects(db, user.sub, profile.timezone, Date.now(), source)
    const subject = items.find((item) => item.id === subjectId)
    if (!subject) return fail(c, 404, 'not_found', 'That subject no longer exists.')
    const topics = await listTopics(source, db, user.sub, subjectId)
    return reply(c, { subject, topics })
  } catch (error) {
    return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not load that subject.')
  }
})

subjects.patch('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, updateSchema)
  if (isResponse(parsed)) return parsed
  const subjectId = c.req.param('id')

  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    if (!(await subjectExists(source, db, user.sub, subjectId))) return fail(c, 404, 'not_found', 'That subject no longer exists.')

    const patch: Record<string, unknown> = {}
    if (parsed.name !== undefined) patch.name = parsed.name
    if (parsed.description !== undefined) patch.description = parsed.description ?? null
    if (parsed.color !== undefined) patch.color = parsed.color
    if (parsed.priority !== undefined) patch.priority = parsed.priority
    if (parsed.difficulty !== undefined) patch.difficulty = parsed.difficulty
    if (parsed.weeklyTargetMinutes !== undefined) patch.weekly_target_minutes = parsed.weeklyTargetMinutes ?? null
    if (Object.keys(patch).length === 0) return reply(c, { updated: false })

    if (source.pg && source.workspaceId) {
      const { error } = await source.pg.from('subjects').update(patch).eq('workspace_id', source.workspaceId).eq('id', subjectId)
      if (error) throw toWorkspaceError(error)
    } else {
      const fields = Object.keys(patch).map((key) => `${key} = ?`)
      const values = Object.values(patch)
      fields.push('updated_at = ?')
      values.push(Date.now(), subjectId, user.sub)
      await db.prepare(`UPDATE subjects SET ${fields.join(', ')} WHERE id = ? AND owner_sub = ?`).bind(...values).run()
    }
    return reply(c, { updated: true })
  } catch (error) {
    return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not save the subject.')
  }
})

subjects.delete('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const subjectId = c.req.param('id')
  const now = Date.now()

  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    if (!(await subjectExists(source, db, user.sub, subjectId))) return fail(c, 404, 'not_found', 'That subject no longer exists.')

    // History is preserved: completed sessions keep their subject row, which is
    // soft-deleted. Open work and future sessions for the subject are removed.
    await db.batch([
      db.prepare("DELETE FROM study_sessions WHERE owner_sub = ? AND subject_id = ? AND status = 'planned' AND is_locked = 0 AND starts_at > ?").bind(user.sub, subjectId, now),
      db.prepare('UPDATE study_sessions SET task_id = NULL WHERE owner_sub = ? AND subject_id = ?').bind(user.sub, subjectId),
      db.prepare('DELETE FROM tasks WHERE owner_sub = ? AND subject_id = ?').bind(user.sub, subjectId),
      db.prepare('DELETE FROM assessments WHERE owner_sub = ? AND subject_id = ?').bind(user.sub, subjectId),
    ])

    if (source.pg && source.workspaceId) {
      const { error: topicsError } = await source.pg.from('topics').delete().eq('workspace_id', source.workspaceId).eq('subject_id', subjectId)
      if (topicsError) throw toWorkspaceError(topicsError)
      const { error } = await source.pg.from('subjects').update({ deleted_at: new Date(now).toISOString() }).eq('workspace_id', source.workspaceId).eq('id', subjectId)
      if (error) throw toWorkspaceError(error)
    } else {
      await db.batch([
        db.prepare('DELETE FROM topics WHERE owner_sub = ? AND subject_id = ?').bind(user.sub, subjectId),
        db.prepare('UPDATE subjects SET deleted_at = ?, updated_at = ? WHERE id = ? AND owner_sub = ?').bind(now, now, subjectId, user.sub),
      ])
    }
    return reply(c, { deleted: true })
  } catch (error) {
    return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not delete the subject.')
  }
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

  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    if (!(await subjectExists(source, db, user.sub, subjectId))) return fail(c, 404, 'not_found', 'That subject no longer exists.')
    const topicId = await createTopic(source, db, user.sub, subjectId, {
      name: parsed.name,
      description: parsed.description ?? null,
      estimatedMinutes: parsed.estimatedMinutes ?? null,
      status: parsed.status,
    })
    return reply(c, { id: topicId }, 201)
  } catch (error) {
    return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not add the topic.')
  }
})

export const topics = new Hono<AppContext>()

topics.patch('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, topicSchema.partial())
  if (isResponse(parsed)) return parsed
  const topicId = c.req.param('id')

  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    const changed = await updateTopic(source, db, user.sub, topicId, {
      name: parsed.name,
      description: parsed.description === undefined ? undefined : (parsed.description ?? null),
      estimatedMinutes: parsed.estimatedMinutes === undefined ? undefined : (parsed.estimatedMinutes ?? null),
      status: parsed.status,
    })
    return reply(c, { updated: changed })
  } catch (error) {
    return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not save the topic.')
  }
})

topics.delete('/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const topicId = c.req.param('id')

  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    await deleteTopic(source, db, user.sub, topicId)
    return reply(c, { deleted: true })
  } catch (error) {
    return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not delete the topic.')
  }
})
