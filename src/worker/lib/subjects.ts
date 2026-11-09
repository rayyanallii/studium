// Subjects and topics are workspace records in Postgres (RLS-scoped). Tasks,
// assessments and sessions still live in D1 and reference a subject by id, so
// they are hydrated through `SubjectLookup` instead of a cross-database JOIN.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { FreebuffUser } from '@freebuff/auth'

import type { Env } from '../env'
import { many, one } from '../db'
import { ensureWorkspace, toWorkspaceError, workspaceClient } from './pg'
import { startOfWeek } from './rows'
import type { SubjectDirectory, SubjectLookup } from './rows'
import type { Priority, Subject, Topic } from '../../shared/types'

export interface SubjectRef {
  id: string
  name: string
  color: string
  priority: Priority
  difficulty: number
  weeklyTargetMinutes: number | null
}

export interface SubjectRecord extends SubjectRef {
  description: string | null
  createdAt: number
  updatedAt: number
}

export interface SubjectSource {
  pg: SupabaseClient | null
  workspaceId: string | null
}

/** Postgres when the request carries a Supabase session; D1 for the dev identity. */
export async function subjectSource(env: Env, token: string | undefined, user: FreebuffUser): Promise<SubjectSource> {
  const pg = workspaceClient(env, token)
  if (!pg) return { pg: null, workspaceId: null }
  return { pg, workspaceId: await ensureWorkspace(pg, user) }
}

const SUBJECT_COLUMNS = 'id, name, description, color, priority, difficulty, weekly_target_minutes, created_at, updated_at'

const epoch = (value: string | number | null | undefined): number => (typeof value === 'number' ? value : value ? Date.parse(value) : 0)

export async function subjectRecords(source: SubjectSource, db: D1Database, ownerSub: string): Promise<SubjectRecord[]> {
  if (source.pg && source.workspaceId) {
    const { data, error } = await source.pg
      .from('subjects')
      .select(SUBJECT_COLUMNS)
      .eq('workspace_id', source.workspaceId)
      .is('deleted_at', null)
      .order('name')
    if (error) throw toWorkspaceError(error)
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      color: row.color,
      priority: row.priority as Priority,
      difficulty: Number(row.difficulty),
      weeklyTargetMinutes: row.weekly_target_minutes === null ? null : Number(row.weekly_target_minutes),
      createdAt: epoch(row.created_at),
      updatedAt: epoch(row.updated_at),
    }))
  }

  const rows = await many<{
    id: string
    name: string
    description: string | null
    color: string
    priority: string
    difficulty: number
    weekly_target_minutes: number | null
    created_at: number
    updated_at: number
  }>(
    db,
    `SELECT id, name, description, color, priority, difficulty, weekly_target_minutes, created_at, updated_at
     FROM subjects WHERE owner_sub = ? AND deleted_at IS NULL ORDER BY lower(name)`,
    ownerSub,
  )
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    priority: row.priority as Priority,
    difficulty: Number(row.difficulty),
    weeklyTargetMinutes: row.weekly_target_minutes === null ? null : Number(row.weekly_target_minutes),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }))
}

export async function subjectRefs(source: SubjectSource, db: D1Database, ownerSub: string): Promise<Map<string, SubjectRef>> {
  const records = await subjectRecords(source, db, ownerSub)
  return new Map(records.map((record) => [record.id, record]))
}

/** Only the fields the D1-backed domains need to render a subject label. */
export function toLookup(refs: Map<string, SubjectRef>): SubjectLookup {
  return new Map([...refs].map(([id, ref]) => [id, { name: ref.name, color: ref.color }]))
}

export async function topicNames(source: SubjectSource, db: D1Database, ownerSub: string): Promise<Map<string, string>> {
  if (source.pg && source.workspaceId) {
    const { data, error } = await source.pg.from('topics').select('id, name').eq('workspace_id', source.workspaceId)
    if (error) throw toWorkspaceError(error)
    return new Map((data ?? []).map((row) => [row.id, row.name]))
  }
  const rows = await many<{ id: string; name: string }>(db, 'SELECT id, name FROM topics WHERE owner_sub = ?', ownerSub)
  return new Map(rows.map((row) => [row.id, row.name]))
}

/** Labels for the D1-backed domains, which reference Postgres subjects by id. */
export async function subjectDirectory(
  source: SubjectSource,
  db: D1Database,
  ownerSub: string,
  records?: SubjectRecord[],
): Promise<SubjectDirectory> {
  const [subjectRows, topics] = await Promise.all([records ? Promise.resolve(records) : subjectRecords(source, db, ownerSub), topicNames(source, db, ownerSub)])
  return {
    subjects: new Map(subjectRows.map((row) => [row.id, { name: row.name, color: row.color }])) as SubjectLookup,
    topics,
  }
}

export async function subjectExists(source: SubjectSource, db: D1Database, ownerSub: string, subjectId: string): Promise<boolean> {
  if (source.pg && source.workspaceId) {
    const { data, error } = await source.pg
      .from('subjects')
      .select('id')
      .eq('workspace_id', source.workspaceId)
      .eq('id', subjectId)
      .is('deleted_at', null)
      .maybeSingle()
    if (error) throw toWorkspaceError(error)
    return Boolean(data)
  }
  const row = await one<{ id: string }>(db, 'SELECT id FROM subjects WHERE id = ? AND owner_sub = ? AND deleted_at IS NULL', subjectId, ownerSub)
  return Boolean(row)
}

export async function topicExists(source: SubjectSource, db: D1Database, ownerSub: string, topicId: string, subjectId?: string): Promise<boolean> {
  if (source.pg && source.workspaceId) {
    let query = source.pg.from('topics').select('id').eq('workspace_id', source.workspaceId).eq('id', topicId)
    if (subjectId) query = query.eq('subject_id', subjectId)
    const { data, error } = await query.maybeSingle()
    if (error) throw toWorkspaceError(error)
    return Boolean(data)
  }
  const row = subjectId
    ? await one<{ id: string }>(db, 'SELECT id FROM topics WHERE id = ? AND owner_sub = ? AND subject_id = ?', topicId, ownerSub, subjectId)
    : await one<{ id: string }>(db, 'SELECT id FROM topics WHERE id = ? AND owner_sub = ?', topicId, ownerSub)
  return Boolean(row)
}

/* ------------------------------------------------------------------ topics -- */

interface TopicRow {
  id: string
  subject_id: string
  name: string
  description: string | null
  estimated_minutes: number | null
  status: string
  created_at: string | number
  updated_at: string | number
}

const mapTopic = (row: TopicRow): Topic => ({
  id: row.id,
  subjectId: row.subject_id,
  name: row.name,
  description: row.description ?? null,
  estimatedMinutes: row.estimated_minutes === null ? null : Number(row.estimated_minutes),
  status: row.status as Topic['status'],
  createdAt: epoch(row.created_at),
  updatedAt: epoch(row.updated_at),
})

export async function listTopics(source: SubjectSource, db: D1Database, ownerSub: string, subjectId: string): Promise<Topic[]> {
  if (source.pg && source.workspaceId) {
    const { data, error } = await source.pg
      .from('topics')
      .select('id, subject_id, name, description, estimated_minutes, status, created_at, updated_at')
      .eq('workspace_id', source.workspaceId)
      .eq('subject_id', subjectId)
      .order('created_at')
    if (error) throw toWorkspaceError(error)
    return (data ?? []).map((row) => mapTopic(row as TopicRow))
  }
  const rows = await many<TopicRow>(db, 'SELECT * FROM topics WHERE owner_sub = ? AND subject_id = ? ORDER BY created_at', ownerSub, subjectId)
  return rows.map(mapTopic)
}

export async function createTopic(
  source: SubjectSource,
  db: D1Database,
  ownerSub: string,
  subjectId: string,
  values: { name: string; description: string | null; estimatedMinutes: number | null; status: Topic['status'] },
): Promise<string> {
  const id = crypto.randomUUID()
  if (source.pg && source.workspaceId) {
    const { error } = await source.pg.from('topics').insert({
      id,
      workspace_id: source.workspaceId,
      subject_id: subjectId,
      name: values.name,
      description: values.description,
      estimated_minutes: values.estimatedMinutes,
      status: values.status,
    })
    if (error) throw toWorkspaceError(error)
    return id
  }
  const now = Date.now()
  await db
    .prepare(
      'INSERT INTO topics (id, owner_sub, subject_id, name, description, estimated_minutes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(id, ownerSub, subjectId, values.name, values.description, values.estimatedMinutes, values.status, now, now)
    .run()
  return id
}

export async function updateTopic(
  source: SubjectSource,
  db: D1Database,
  ownerSub: string,
  topicId: string,
  values: Partial<{ name: string; description: string | null; estimatedMinutes: number | null; status: Topic['status'] }>,
): Promise<boolean> {
  if (source.pg && source.workspaceId) {
    const patch: Record<string, unknown> = {}
    if (values.name !== undefined) patch.name = values.name
    if (values.description !== undefined) patch.description = values.description
    if (values.estimatedMinutes !== undefined) patch.estimated_minutes = values.estimatedMinutes
    if (values.status !== undefined) patch.status = values.status
    if (Object.keys(patch).length === 0) return false
    const { error } = await source.pg.from('topics').update(patch).eq('workspace_id', source.workspaceId).eq('id', topicId)
    if (error) throw toWorkspaceError(error)
    return true
  }
  const fields: string[] = []
  const params: unknown[] = []
  if (values.name !== undefined) {
    fields.push('name = ?')
    params.push(values.name)
  }
  if (values.description !== undefined) {
    fields.push('description = ?')
    params.push(values.description)
  }
  if (values.estimatedMinutes !== undefined) {
    fields.push('estimated_minutes = ?')
    params.push(values.estimatedMinutes)
  }
  if (values.status !== undefined) {
    fields.push('status = ?')
    params.push(values.status)
  }
  if (fields.length === 0) return false
  fields.push('updated_at = ?')
  params.push(Date.now(), topicId, ownerSub)
  await db.prepare(`UPDATE topics SET ${fields.join(', ')} WHERE id = ? AND owner_sub = ?`).bind(...params).run()
  return true
}

export async function deleteTopic(source: SubjectSource, db: D1Database, ownerSub: string, topicId: string): Promise<void> {
  await db.prepare('UPDATE tasks SET topic_id = NULL WHERE owner_sub = ? AND topic_id = ?').bind(ownerSub, topicId).run()
  if (source.pg && source.workspaceId) {
    const { error } = await source.pg.from('topics').delete().eq('workspace_id', source.workspaceId).eq('id', topicId)
    if (error) throw toWorkspaceError(error)
    return
  }
  await db.prepare('DELETE FROM topics WHERE id = ? AND owner_sub = ?').bind(topicId, ownerSub).run()
}

/* ------------------------------------------------------- stats and listing -- */

async function topicTotals(source: SubjectSource, db: D1Database, ownerSub: string): Promise<Map<string, { total: number; done: number }>> {
  if (source.pg && source.workspaceId) {
    const { data, error } = await source.pg.from('topics').select('subject_id, status').eq('workspace_id', source.workspaceId)
    if (error) throw toWorkspaceError(error)
    const totals = new Map<string, { total: number; done: number }>()
    for (const row of data ?? []) {
      const current = totals.get(row.subject_id) ?? { total: 0, done: 0 }
      current.total += 1
      if (row.status === 'completed') current.done += 1
      totals.set(row.subject_id, current)
    }
    return totals
  }
  const rows = await many<{ subject_id: string; total: number; done: number }>(
    db,
    "SELECT subject_id, COUNT(*) AS total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS done FROM topics WHERE owner_sub = ? GROUP BY subject_id",
    ownerSub,
  )
  return new Map(rows.map((row) => [row.subject_id, { total: Number(row.total), done: Number(row.done) }]))
}

/** Subjects with the week's study, plan and deadline signals the UI shows. */
export async function loadSubjects(
  db: D1Database,
  ownerSub: string,
  timezone: string,
  now: number,
  source: SubjectSource,
  existing?: SubjectRecord[],
): Promise<Subject[]> {
  const records = existing ?? (await subjectRecords(source, db, ownerSub))
  if (records.length === 0) return []

  const weekFrom = startOfWeek(now, timezone)
  const weekTo = weekFrom + 7 * 86_400_000

  const [topics, openTasks, assessed, studied, planned] = await Promise.all([
    topicTotals(source, db, ownerSub),
    many<{ subject_id: string; n: number }>(db, "SELECT subject_id, COUNT(*) AS n FROM tasks WHERE owner_sub = ? AND status IN ('todo','in_progress') GROUP BY subject_id", ownerSub),
    many<{ subject_id: string; next_at: number }>(
      db,
      'SELECT subject_id, MIN(due_at) AS next_at FROM assessments WHERE owner_sub = ? AND due_at >= ? GROUP BY subject_id',
      ownerSub,
      now - 86_400_000,
    ),
    many<{ subject_id: string; minutes: number }>(
      db,
      "SELECT subject_id, COALESCE(SUM(actual_minutes), 0) AS minutes FROM study_sessions WHERE owner_sub = ? AND actual_minutes > 0 AND starts_at >= ? AND starts_at < ? GROUP BY subject_id",
      ownerSub,
      weekFrom,
      weekTo,
    ),
    many<{ subject_id: string; minutes: number }>(
      db,
      "SELECT subject_id, COALESCE(SUM(planned_minutes), 0) AS minutes FROM study_sessions WHERE owner_sub = ? AND status = 'planned' AND starts_at >= ? AND starts_at < ? GROUP BY subject_id",
      ownerSub,
      weekFrom,
      weekTo,
    ),
  ])

  const byId = <T extends { subject_id: string }>(list: T[]) => new Map(list.map((item) => [item.subject_id, item]))
  const taskMap = byId(openTasks)
  const studiedMap = byId(studied)
  const plannedMap = byId(planned)
  const assessmentMap = byId(assessed)

  return records.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    color: record.color,
    priority: record.priority,
    difficulty: record.difficulty,
    weeklyTargetMinutes: record.weeklyTargetMinutes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    stats: {
      openTasks: Number(taskMap.get(record.id)?.n ?? 0),
      topics: topics.get(record.id)?.total ?? 0,
      topicsDone: topics.get(record.id)?.done ?? 0,
      studiedWeekMinutes: Number(studiedMap.get(record.id)?.minutes ?? 0),
      plannedWeekMinutes: Number(plannedMap.get(record.id)?.minutes ?? 0),
      nextAssessmentAt: assessmentMap.get(record.id)?.next_at ?? null,
    },
  }))
}
