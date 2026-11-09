// Optional sample workspace. Never applied automatically: a user has to ask for
// it from Settings, so real accounts never contain invented history.
import { DateTime } from 'luxon'

import { id, many, num, one } from './db'
import { atLocalTime, localDate, minutesOfDay } from './lib/dates'
import { buildSchedule } from './lib/scheduler'
import type { SchedulerInput } from './lib/scheduler'
import type { PrefsRow } from './lib/rows'

const SUBJECTS = [
  { name: 'Mathematics', color: '#635BFF', priority: 'high', difficulty: 4, target: 360, topics: ['Calculus: differentiation', 'Calculus: integration', 'Linear algebra'] },
  { name: 'Physics', color: '#2F77D1', priority: 'high', difficulty: 4, target: 300, topics: ["Newton's laws", 'Waves and optics', 'Thermodynamics'] },
  { name: 'Chemistry', color: '#1F9D72', priority: 'medium', difficulty: 3, target: 180, topics: ['Chemical bonding', 'Organic reactions'] },
] as const

const TASKS = [
  { subject: 'Mathematics', topic: 'Calculus: differentiation', title: 'Practice calculus problems', minutes: 90, inDays: 2, priority: 'high' },
  { subject: 'Physics', topic: "Newton's laws", title: "Revise Newton's laws", minutes: 60, inDays: 3, priority: 'high' },
  { subject: 'Chemistry', topic: 'Chemical bonding', title: 'Review chemical bonding', minutes: 45, inDays: 5, priority: 'medium' },
  { subject: 'Mathematics', topic: 'Linear algebra', title: 'Complete algebra worksheet', minutes: 50, inDays: 1, priority: 'medium' },
  { subject: 'Physics', topic: 'Waves and optics', title: 'Prepare for chapter test', minutes: 120, inDays: 6, priority: 'high' },
] as const

export async function clearWorkspace(db: D1Database, ownerSub: string) {
  await db.batch([
    db.prepare('DELETE FROM focus_runs WHERE owner_sub = ?').bind(ownerSub),
    db.prepare('DELETE FROM study_sessions WHERE owner_sub = ?').bind(ownerSub),
    db.prepare('DELETE FROM study_plans WHERE owner_sub = ?').bind(ownerSub),
    db.prepare('DELETE FROM availability_overrides WHERE owner_sub = ?').bind(ownerSub),
    db.prepare('DELETE FROM availability_rules WHERE owner_sub = ?').bind(ownerSub),
    db.prepare('DELETE FROM assessments WHERE owner_sub = ?').bind(ownerSub),
    db.prepare('DELETE FROM tasks WHERE owner_sub = ?').bind(ownerSub),
    db.prepare('DELETE FROM topics WHERE owner_sub = ?').bind(ownerSub),
    db.prepare('DELETE FROM subjects WHERE owner_sub = ?').bind(ownerSub),
  ])
}

export async function seedDemo(db: D1Database, ownerSub: string, timezone: string, prefs: PrefsRow) {
  const now = Date.now()
  const today = localDate(now, timezone)
  const subjectIds = new Map<string, string>()
  const topicIds = new Map<string, string>()
  const statements: D1PreparedStatement[] = []

  for (const subject of SUBJECTS) {
    const subjectId = id()
    subjectIds.set(subject.name, subjectId)
    statements.push(
      db
        .prepare(
          'INSERT INTO subjects (id, owner_sub, name, description, color, priority, difficulty, weekly_target_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(subjectId, ownerSub, subject.name, null, subject.color, subject.priority, subject.difficulty, subject.target, now, now),
    )
    for (const topic of subject.topics) {
      const topicId = id()
      topicIds.set(`${subject.name}|${topic}`, topicId)
      statements.push(
        db
          .prepare('INSERT INTO topics (id, owner_sub, subject_id, name, description, estimated_minutes, status, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)')
          .bind(topicId, ownerSub, subjectId, topic, 60, 'not_started', now, now),
      )
    }
  }

  for (const task of TASKS) {
    const subjectId = subjectIds.get(task.subject)!
    const topicId = topicIds.get(`${task.subject}|${task.topic}`) ?? null
    const due = atLocalTime(DateTime.fromISO(today, { zone: timezone }).plus({ days: task.inDays }).toISODate() ?? today, 18 * 60, timezone)
    statements.push(
      db
        .prepare(
          `INSERT INTO tasks (id, owner_sub, subject_id, topic_id, title, description, priority, status, due_at, estimated_minutes, completed_minutes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NULL, ?, 'todo', ?, ?, 0, ?, ?)`,
        )
        .bind(id(), ownerSub, subjectId, topicId, task.title, task.priority, due, task.minutes, now, now),
    )
  }

  const exams = [
    { subject: 'Mathematics', title: 'Calculus midterm', inDays: 5, hour: 9 },
    { subject: 'Physics', title: 'Chapter test: waves', inDays: 8, hour: 11 },
    { subject: 'Chemistry', title: 'Bonding quiz', inDays: 3, hour: 14 },
  ]
  for (const exam of exams) {
    const date = DateTime.fromISO(today, { zone: timezone }).plus({ days: exam.inDays }).toISODate() ?? today
    statements.push(
      db
        .prepare('INSERT INTO assessments (id, owner_sub, subject_id, title, description, due_at, priority, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)')
        .bind(id(), ownerSub, subjectIds.get(exam.subject)!, exam.title, atLocalTime(date, exam.hour * 60, timezone), 'high', now, now),
    )
  }

  // Monday–Friday 17:00–19:00, Saturday 10:00–13:00, Sunday off.
  const windows = [
    ...[1, 2, 3, 4, 5].map((weekday) => ({ weekday, start: '17:00', end: '19:00' })),
    { weekday: 6, start: '10:00', end: '13:00' },
  ]
  for (const window of windows) {
    statements.push(
      db
        .prepare('INSERT INTO availability_rules (id, owner_sub, weekday, start_local_time, end_local_time, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id(), ownerSub, window.weekday, window.start, window.end, now),
    )
  }

  await db.batch(statements)

  // Seed an active plan so the demo immediately shows a real schedule.
  const subjectRows = await many<{ id: string; name: string; color: string; priority: string; difficulty: number; weekly_target_minutes: number | null }>(
    db,
    'SELECT id, name, color, priority, difficulty, weekly_target_minutes FROM subjects WHERE owner_sub = ?',
    ownerSub,
  )
  const taskRows = await many<{ id: string; subject_id: string; title: string; priority: string; due_at: number | null; estimated_minutes: number }>(
    db,
    'SELECT id, subject_id, title, priority, due_at, estimated_minutes FROM tasks WHERE owner_sub = ?',
    ownerSub,
  )
  const startDate = today
  const horizonDays = num(prefs.planning_horizon_days, 7)

  const input: SchedulerInput = {
    timezone,
    startDate,
    horizonDays,
    now,
    preferences: {
      preferredSessionMinutes: num(prefs.preferred_session_minutes, 50),
      breakMinutes: num(prefs.break_minutes, 10),
      maxDailyMinutes: num(prefs.max_daily_minutes, 240),
      planningStyle: 'balanced',
      urgentFirst: false,
    },
    subjects: subjectRows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      priority: row.priority as 'low' | 'medium' | 'high',
      difficulty: num(row.difficulty, 3),
      weeklyTargetMinutes: row.weekly_target_minutes === null ? null : Number(row.weekly_target_minutes),
      studiedWeekMinutes: 0,
    })),
    tasks: taskRows.map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      title: row.title,
      priority: row.priority as 'low' | 'medium' | 'high',
      dueAt: row.due_at === null ? null : Number(row.due_at),
      estimatedMinutes: num(row.estimated_minutes),
      completedMinutes: 0,
    })),
    availability: windows.map((w) => ({ weekday: w.weekday, startLocalTime: w.start, endLocalTime: w.end })),
    overrides: [],
    existingSessions: [],
  }

  const result = buildSchedule(input)
  if (result.sessions.length === 0) return { subjects: subjectRows.length, sessions: 0 }

  const planId = id()
  const endDate = DateTime.fromISO(startDate, { zone: timezone }).plus({ days: horizonDays - 1 }).toISODate() ?? startDate
  const payload = {
    sessions: result.sessions,
    allocations: result.allocations,
    warnings: result.warnings,
    suggestions: result.suggestions,
    unscheduled: result.unscheduled,
    totals: result.totals,
    complete: result.complete,
    summary: 'A sample week built from demo subjects, tasks and evenings.',
    explanation: 'Sample workspace generated with the deterministic scheduler. Regenerate any time.',
  }
  const planStatements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO study_plans (id, owner_sub, start_date, end_date, version, status, generation_source, explanation, summary, payload, warnings, totals, request_id, created_at, accepted_at)
         VALUES (?, ?, ?, ?, 1, 'active', 'heuristic', ?, ?, ?, ?, ?, NULL, ?, ?)`,
      )
      .bind(
        planId,
        ownerSub,
        startDate,
        endDate,
        payload.explanation,
        payload.summary,
        JSON.stringify(payload),
        JSON.stringify(result.warnings),
        JSON.stringify(result.totals),
        now,
        now,
      ),
  ]
  for (const session of result.sessions) {
    planStatements.push(
      db
        .prepare(
          `INSERT INTO study_sessions (id, owner_sub, plan_id, subject_id, task_id, title, starts_at, ends_at, planned_minutes, actual_minutes, status, is_locked, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'planned', 0, ?, ?)`,
        )
        .bind(id(), ownerSub, planId, session.subjectId, session.taskId, session.title, session.startsAt, session.endsAt, session.plannedMinutes, now, now),
    )
  }
  // Keep the total requested minutes honest for the dashboard.
  planStatements.push(
    db.prepare('UPDATE profiles SET onboarding_completed = 1, onboarding_step = 6, timezone = ?, updated_at = ? WHERE owner_sub = ?').bind(timezone, now, ownerSub),
  )
  await db.batch(planStatements)

  return { subjects: subjectRows.length, sessions: result.sessions.length }
}

/** Total minutes of availability across a week, used for onboarding hints. */
export async function weeklyAvailabilityMinutes(db: D1Database, ownerSub: string): Promise<number> {
  const rows = await many<{ start_local_time: string; end_local_time: string }>(db, 'SELECT start_local_time, end_local_time FROM availability_rules WHERE owner_sub = ?', ownerSub)
  return rows.reduce((sum, row) => sum + Math.max(0, minutesOfDay(row.end_local_time) - minutesOfDay(row.start_local_time)), 0)
}

export async function storageNotice(db: D1Database): Promise<{ ok: boolean }> {
  try {
    await one(db, 'SELECT 1 AS ok')
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
