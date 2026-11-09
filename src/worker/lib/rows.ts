// Row shapes and mapping helpers. Every loader is scoped to the signed-in
// user; there is no query in this file that accepts a user id from a client.

import { DateTime } from 'luxon'
import type { FreebuffUser } from '@freebuff/auth'

import type { Assessment, Priority, Profile, SessionStatus, StudySession, Subject, Task } from '../../shared/types'
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

export interface SubjectRow {
  id: string
  name: string
  description: string | null
  color: string
  priority: string
  difficulty: number
  weekly_target_minutes: number | null
  created_at: number
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
  subject_name?: string
  subject_color?: string
  topic_name?: string | null
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
  subject_name?: string
  subject_color?: string
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
  subject_name: string
  subject_color: string
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

export async function loadSubjects(db: D1Database, ownerSub: string, timezone: string, now: number): Promise<Subject[]> {
  const rows = await many<SubjectRow>(
    db,
    'SELECT id, name, description, color, priority, difficulty, weekly_target_minutes, created_at, updated_at FROM subjects WHERE owner_sub = ? ORDER BY lower(name)',
    ownerSub,
  )
  if (rows.length === 0) return []

  const weekFrom = startOfWeek(now, timezone)
  const weekTo = DateTime.fromMillis(weekFrom, { zone: timezone }).plus({ days: 7 }).toMillis()

  const [openTasks, topicTotals, studied, planned, nextAssessment] = await Promise.all([
    many<{ subject_id: string; n: number }>(db, "SELECT subject_id, COUNT(*) AS n FROM tasks WHERE owner_sub = ? AND status IN ('todo','in_progress') GROUP BY subject_id", ownerSub),
    many<{ subject_id: string; total: number; done: number }>(
      db,
      "SELECT subject_id, COUNT(*) AS total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS done FROM topics WHERE owner_sub = ? GROUP BY subject_id",
      ownerSub,
    ),
    many<{ subject_id: string; minutes: number }>(
      db,
      `SELECT ss.subject_id, COALESCE(SUM(ss.actual_minutes), 0) AS minutes
       FROM study_sessions ss
       WHERE ss.owner_sub = ? AND ss.actual_minutes > 0 AND ss.starts_at >= ? AND ss.starts_at < ?
       GROUP BY ss.subject_id`,
      ownerSub,
      weekFrom,
      weekTo,
    ),
    many<{ subject_id: string; minutes: number }>(
      db,
      `SELECT subject_id, COALESCE(SUM(planned_minutes), 0) AS minutes
       FROM study_sessions WHERE owner_sub = ? AND status = 'planned' AND starts_at >= ? AND starts_at < ?
       GROUP BY subject_id`,
      ownerSub,
      weekFrom,
      weekTo,
    ),
    many<{ subject_id: string; next_at: number }>(
      db,
      'SELECT subject_id, MIN(due_at) AS next_at FROM assessments WHERE owner_sub = ? AND due_at >= ? GROUP BY subject_id',
      ownerSub,
      now - 86_400_000,
    ),
  ])

  const byId = <T extends { subject_id: string }>(list: T[]) => new Map(list.map((item) => [item.subject_id, item]))
  const taskMap = byId(openTasks)
  const topicMap = byId(topicTotals)
  const studiedMap = byId(studied)
  const plannedMap = byId(planned)
  const assessmentMap = byId(nextAssessment)

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: text(row.description),
    color: row.color,
    priority: row.priority as Priority,
    difficulty: num(row.difficulty, 3),
    weeklyTargetMinutes: row.weekly_target_minutes === null ? null : num(row.weekly_target_minutes),
    createdAt: num(row.created_at),
    updatedAt: num(row.updated_at),
    stats: {
      openTasks: num(taskMap.get(row.id)?.n),
      topics: num(topicMap.get(row.id)?.total),
      topicsDone: num(topicMap.get(row.id)?.done),
      studiedWeekMinutes: num(studiedMap.get(row.id)?.minutes),
      plannedWeekMinutes: num(plannedMap.get(row.id)?.minutes),
      nextAssessmentAt: assessmentMap.get(row.id)?.next_at ?? null,
    },
  }))
}

const TASK_SELECT = `
  SELECT t.*, s.name AS subject_name, s.color AS subject_color, tp.name AS topic_name,
    COALESCE((SELECT SUM(ss.planned_minutes) FROM study_sessions ss
      WHERE ss.task_id = t.id AND ss.owner_sub = t.owner_sub AND ss.status = 'planned' AND ss.starts_at > ?), 0) AS scheduled_minutes
  FROM tasks t
  JOIN subjects s ON s.id = t.subject_id AND s.owner_sub = t.owner_sub
  LEFT JOIN topics tp ON tp.id = t.topic_id AND tp.owner_sub = t.owner_sub`

export function mapTask(row: TaskRow): Task {
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
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    topicName: row.topic_name ?? undefined,
  }
}

export async function loadTasks(db: D1Database, ownerSub: string, now: number, options: { openOnly?: boolean; subjectId?: string } = {}): Promise<Task[]> {
  const clauses = ['t.owner_sub = ?']
  const params: unknown[] = [now, ownerSub]
  if (options.openOnly) clauses.push("t.status IN ('todo','in_progress')")
  if (options.subjectId) {
    clauses.push('t.subject_id = ?')
    params.push(options.subjectId)
  }
  const rows = await many<TaskRow>(db, `${TASK_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY t.created_at DESC`, ...params)
  return rows.map(mapTask)
}

export async function loadTask(db: D1Database, ownerSub: string, taskId: string, now: number): Promise<Task | null> {
  const row = await one<TaskRow>(db, `${TASK_SELECT} WHERE t.owner_sub = ? AND t.id = ?`, now, ownerSub, taskId)
  return row ? mapTask(row) : null
}

export async function loadAssessments(db: D1Database, ownerSub: string): Promise<Assessment[]> {
  const rows = await many<AssessmentRow>(
    db,
    `SELECT a.*, s.name AS subject_name, s.color AS subject_color
     FROM assessments a JOIN subjects s ON s.id = a.subject_id AND s.owner_sub = a.owner_sub
     WHERE a.owner_sub = ? ORDER BY a.due_at`,
    ownerSub,
  )
  return rows.map((row) => ({
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    description: text(row.description),
    dueAt: num(row.due_at),
    priority: row.priority as Priority,
    createdAt: num(row.created_at),
    updatedAt: num(row.updated_at),
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
  }))
}

export const SESSION_SELECT = `
  SELECT ss.*, s.name AS subject_name, s.color AS subject_color
  FROM study_sessions ss
  JOIN subjects s ON s.id = ss.subject_id AND s.owner_sub = ss.owner_sub`

export function mapSession(row: SessionRow): StudySession {
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
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
  }
}

export async function loadSessions(
  db: D1Database,
  ownerSub: string,
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
  return rows.map(mapSession)
}

export async function loadSession(db: D1Database, ownerSub: string, sessionId: string): Promise<StudySession | null> {
  const row = await one<SessionRow>(db, `${SESSION_SELECT} WHERE ss.owner_sub = ? AND ss.id = ?`, ownerSub, sessionId)
  return row ? mapSession(row) : null
}

/** Planned sessions whose end has passed become `missed` so every screen agrees. */
export async function expireSessions(db: D1Database, ownerSub: string, now: number): Promise<void> {
  await db.prepare("UPDATE study_sessions SET status = 'missed', updated_at = ? WHERE owner_sub = ? AND status = 'planned' AND ends_at < ?").bind(now, ownerSub, now).run()
}

export function todayFor(timezone: string, now: number): string {
  return localDate(timezone ? now : now, timezone)
}
