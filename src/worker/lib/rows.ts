// Row shapes and mapping helpers. Every loader is scoped to the signed-in
// user; there is no query in this file that accepts a user id from a client.
//
// Subjects and topics live in Postgres, while tasks, assessments and sessions
// still live in D1. A `SubjectDirectory` carries the Postgres labels into the
// D1 loaders, which replaces the cross-database JOINs used before the port.

import { DateTime } from 'luxon'
import type { FreebuffUser } from '@freebuff/auth'

import type { Assessment, Priority, Profile, SessionStatus, StudySession, Task } from '../../shared/types'
import { bool, many, num, one, text } from '../db'
import { localDate } from './dates'

export interface ProfileRow {
  owner_sub: string
  display_name: string
  academic_context: string | null
  learning_goal: string | null
  timezone: string
  onboarding_completed: number
  onboarding_step: number
  created_at: number
  updated_at: number
}

export interface PrefsRow {
  owner_sub: string
  preferred_session_minutes: number
  break_minutes: number
  max_daily_minutes: number
  planning_horizon_days: number
  planning_style: string
  theme: string
  urgent_first: number
  updated_at: number
}

export interface TaskRow {
  id: string
  subject_id: string
  topic_id: string | null
  title: string
  description: string | null
  priority: string
  status: string
  due_at: number | null
  estimated_minutes: number
  completed_minutes: number
  created_at: number
  updated_at: number
  scheduled_minutes?: number
}

export interface AssessmentRow {
  id: string
  subject_id: string
  title: string
  description: string | null
  due_at: number
  priority: string
  created_at: number
  updated_at: number
}

export interface SessionRow {
  id: string
  plan_id: string | null
  subject_id: string
  task_id: string | null
  title: string
  starts_at: number
  ends_at: number
  planned_minutes: number
  actual_minutes: number
  status: string
  is_locked: number
  completed_at: number | null
}

/** Subject labels keyed by id, used where a D1 row points at a Postgres subject. */
export type SubjectLookup = Map<string, { name: string; color: string }>

export interface SubjectDirectory {
  subjects: SubjectLookup
  topics: Map<string, string>
}

export const mapProfile = (row: ProfileRow): Profile => ({
  displayName: row.display_name,
  academicContext: (row.academic_context as Profile['academicContext']) ?? null,
  learningGoal: text(row.learning_goal),
  timezone: row.timezone,
  onboardingCompleted: bool(row.onboarding_completed),
  onboardingStep: num(row.onboarding_step, 1),
})

export const mapPreferences = (row: PrefsRow) => ({
  preferredSessionMinutes: num(row.preferred_session_minutes, 50),
  breakMinutes: num(row.break_minutes, 10),
  maxDailyMinutes: num(row.max_daily_minutes, 240),
  planningHorizonDays: num(row.planning_horizon_days, 7),
  planningStyle: (['balanced', 'deadline', 'difficult'].includes(row.planning_style) ? row.planning_style : 'balanced') as 'balanced' | 'deadline' | 'difficult',
  theme: (['light', 'dark', 'system'].includes(row.theme) ? row.theme : 'dark') as 'light' | 'dark' | 'system',
  urgentFirst: bool(row.urgent_first),
})

export async function ensureProfile(db: D1Database, user: FreebuffUser): Promise<{ profile: ProfileRow; prefs: PrefsRow }> {
  const now = Date.now()
  const fallbackName = user.name?.trim() || user.email?.split('@')[0] || 'Student'
  await db
    .batch([
      db
        .prepare('INSERT OR IGNORE INTO profiles (owner_sub, display_name, timezone, onboarding_completed, onboarding_step, created_at, updated_at) VALUES (?, ?, ?, 0, 1, ?, ?)')
        .bind(user.sub, fallbackName.slice(0, 60), 'UTC', now, now),
      db
        .prepare(
          'INSERT OR IGNORE INTO study_preferences (owner_sub, preferred_session_minutes, break_minutes, max_daily_minutes, planning_horizon_days, planning_style, theme, urgent_first, updated_at) VALUES (?, 50, 10, 240, 7, ?, ?, 0, ?)',
        )
        .bind(user.sub, 'balanced', 'dark', now),
    ])
    .catch((error) => {
      // A duplicate registration simply means another request created the row.
      console.error('ensureProfile', error instanceof Error ? error.message : error)
    })
  const profile = await one<ProfileRow>(db, 'SELECT * FROM profiles WHERE owner_sub = ?', user.sub)
  const prefs = await one<PrefsRow>(db, 'SELECT * FROM study_preferences WHERE owner_sub = ?', user.sub)
  if (!profile || !prefs) throw new Error('Profile could not be created')
  return { profile, prefs }
}

export function startOfWeek(timestamp: number, timezone: string): number {
  return DateTime.fromMillis(timestamp, { zone: timezone }).startOf('week').toMillis()
}

const TASK_SELECT = `
  SELECT t.*,
    COALESCE((SELECT SUM(ss.planned_minutes) FROM study_sessions ss
      WHERE ss.task_id = t.id AND ss.owner_sub = t.owner_sub AND ss.status = 'planned' AND ss.starts_at > ?), 0) AS scheduled_minutes
  FROM tasks t`

export function mapTask(row: TaskRow, directory: SubjectDirectory): Task {
  const subject = directory.subjects.get(row.subject_id)
  return {
    id: row.id,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    title: row.title,
    description: text(row.description),
    priority: row.priority as Priority,
    status: row.status as Task['status'],
    dueAt: row.due_at === null ? null : num(row.due_at),
    estimatedMinutes: num(row.estimated_minutes),
    completedMinutes: num(row.completed_minutes),
    scheduledMinutes: num(row.scheduled_minutes),
    createdAt: num(row.created_at),
    updatedAt: num(row.updated_at),
    subjectName: subject?.name ?? 'Deleted subject',
    subjectColor: subject?.color ?? '#5C6070',
    topicName: row.topic_id ? directory.topics.get(row.topic_id) : undefined,
  }
}

export async function loadTasks(
  db: D1Database,
  ownerSub: string,
  now: number,
  directory: SubjectDirectory,
  options: { openOnly?: boolean; subjectId?: string } = {},
): Promise<Task[]> {
  const clauses = ['t.owner_sub = ?']
  const params: unknown[] = [now, ownerSub]
  if (options.openOnly) clauses.push("t.status IN ('todo','in_progress')")
  if (options.subjectId) {
    clauses.push('t.subject_id = ?')
    params.push(options.subjectId)
  }
  const rows = await many<TaskRow>(db, `${TASK_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY t.created_at DESC`, ...params)
  return rows.filter((row) => directory.subjects.has(row.subject_id)).map((row) => mapTask(row, directory))
}

export async function loadTask(db: D1Database, ownerSub: string, taskId: string, now: number, directory: SubjectDirectory): Promise<Task | null> {
  const row = await one<TaskRow>(db, `${TASK_SELECT} WHERE t.owner_sub = ? AND t.id = ?`, now, ownerSub, taskId)
  if (!row || !directory.subjects.has(row.subject_id)) return null
  return mapTask(row, directory)
}

export async function loadAssessments(db: D1Database, ownerSub: string, directory: SubjectDirectory): Promise<Assessment[]> {
  const rows = await many<AssessmentRow>(db, 'SELECT * FROM assessments WHERE owner_sub = ? ORDER BY due_at', ownerSub)
  return rows
    .filter((row) => directory.subjects.has(row.subject_id))
    .map((row) => {
      const subject = directory.subjects.get(row.subject_id)
      return {
        id: row.id,
        subjectId: row.subject_id,
        title: row.title,
        description: text(row.description),
        dueAt: num(row.due_at),
        priority: row.priority as Priority,
        createdAt: num(row.created_at),
        updatedAt: num(row.updated_at),
        subjectName: subject?.name ?? 'Deleted subject',
        subjectColor: subject?.color ?? '#5C6070',
      }
    })
}

export const SESSION_SELECT = 'SELECT ss.* FROM study_sessions ss'

export function mapSession(row: SessionRow, directory: SubjectDirectory): StudySession {
  const subject = directory.subjects.get(row.subject_id)
  return {
    id: row.id,
    planId: row.plan_id,
    subjectId: row.subject_id,
    taskId: row.task_id,
    title: row.title,
    startsAt: num(row.starts_at),
    endsAt: num(row.ends_at),
    plannedMinutes: num(row.planned_minutes),
    actualMinutes: num(row.actual_minutes),
    status: row.status as SessionStatus,
    isLocked: bool(row.is_locked),
    completedAt: row.completed_at === null ? null : num(row.completed_at),
    subjectName: subject?.name ?? 'Deleted subject',
    subjectColor: subject?.color ?? '#5C6070',
  }
}

export async function loadSessions(
  db: D1Database,
  ownerSub: string,
  directory: SubjectDirectory,
  filter: { from?: number; to?: number; statuses?: string[]; subjectId?: string; limit?: number } = {},
): Promise<StudySession[]> {
  const clauses = ['ss.owner_sub = ?']
  const params: unknown[] = [ownerSub]
  if (filter.from !== undefined) {
    clauses.push('ss.ends_at >= ?')
    params.push(filter.from)
  }
  if (filter.to !== undefined) {
    clauses.push('ss.starts_at <= ?')
    params.push(filter.to)
  }
  if (filter.subjectId) {
    clauses.push('ss.subject_id = ?')
    params.push(filter.subjectId)
  }
  if (filter.statuses?.length) {
    clauses.push(`ss.status IN (${filter.statuses.map(() => '?').join(',')})`)
    params.push(...filter.statuses)
  }
  const limit = Math.min(500, Math.max(1, filter.limit ?? 400))
  const rows = await many<SessionRow>(db, `${SESSION_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY ss.starts_at LIMIT ${limit}`, ...params)
  return rows.filter((row) => directory.subjects.has(row.subject_id)).map((row) => mapSession(row, directory))
}

export async function loadSession(db: D1Database, ownerSub: string, sessionId: string, directory: SubjectDirectory): Promise<StudySession | null> {
  const row = await one<SessionRow>(db, `${SESSION_SELECT} WHERE ss.owner_sub = ? AND ss.id = ?`, ownerSub, sessionId)
  if (!row || !directory.subjects.has(row.subject_id)) return null
  return mapSession(row, directory)
}

/** Planned sessions whose end has passed become `missed` so every screen agrees. */
export async function expireSessions(db: D1Database, ownerSub: string, now: number): Promise<void> {
  await db.prepare("UPDATE study_sessions SET status = 'missed', updated_at = ? WHERE owner_sub = ? AND status = 'planned' AND ends_at < ?").bind(now, ownerSub, now).run()
}

export function todayFor(timezone: string, now: number): string {
  return localDate(timezone ? now : now, timezone)
}
