import { Hono } from 'hono'
import { DateTime } from 'luxon'

import { many, num, one } from '../db'
import type { AppContext } from '../env'
import { dayBounds, localDate } from '../lib/dates'
import { reply } from '../lib/http'
import { ensureProfile, expireSessions, loadAssessments, loadSessions, loadTasks, startOfWeek } from '../lib/rows'
import { loadSubjects, subjectDirectory, subjectRecords, subjectSource } from '../lib/subjects'
import type { AnalyticsData, DashboardData, StudySession } from '../../shared/types'

export const analytics = new Hono<AppContext>()

function completionRate(completed: number, eligible: number): number {
  return eligible > 0 ? Math.round((completed / eligible) * 100) : 0
}

analytics.get('/dashboard', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile } = await ensureProfile(db, user)
  const timezone = profile.timezone
  const now = Date.now()
  await expireSessions(db, user.sub, now)

  const today = localDate(now, timezone)
  const todayBounds = dayBounds(today, timezone)
  const weekFrom = startOfWeek(now, timezone)
  const weekTo = DateTime.fromMillis(weekFrom, { zone: timezone }).plus({ days: 7 }).toMillis()

  const source = await subjectSource(c.env, c.get('accessToken'), user)
  const records = await subjectRecords(source, db, user.sub)
  const directory = await subjectDirectory(source, db, user.sub, records)

  const [subjects, tasks, assessments, todaySessions, weekSessions, activePlan, missed] = await Promise.all([
    loadSubjects(db, user.sub, timezone, now, source, records),
    loadTasks(db, user.sub, now, directory, { openOnly: true }),
    loadAssessments(db, user.sub, directory),
    loadSessions(db, user.sub, directory, { from: todayBounds.start, to: todayBounds.end }),
    loadSessions(db, user.sub, directory, { from: weekFrom, to: weekTo }),
    one<{ id: string }>(db, "SELECT id FROM study_plans WHERE owner_sub = ? AND status = 'active' LIMIT 1", user.sub),
    one<{ n: number }>(
      db,
      "SELECT COUNT(*) AS n FROM study_sessions WHERE owner_sub = ? AND status = 'missed' AND ends_at >= ?",
      user.sub,
      weekFrom,
    ),
  ])

  const eligible = weekSessions.filter((s) => s.endsAt < now && s.status !== 'canceled')
  const completed = eligible.filter((s) => s.status === 'completed')

  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const date = DateTime.fromMillis(weekFrom, { zone: timezone }).plus({ days: i }).toISODate()
    if (date) weekDates.push(date)
  }
  const weekDaily = new Map(weekDates.map((date) => [date, { date, planned: 0, completed: 0 }]))
  for (const session of weekSessions) {
    const bucket = weekDaily.get(localDate(session.startsAt, timezone))
    if (!bucket) continue
    bucket.planned += session.plannedMinutes
    bucket.completed += session.actualMinutes
  }
  const upcomingTasks = [...tasks]
    .sort((a, b) => (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 5)

  const data: DashboardData = {
    date: today,
    greetingName: profile.display_name.split(' ')[0] || profile.display_name,
    today: {
      plannedMinutes: todaySessions.reduce((sum, s) => sum + s.plannedMinutes, 0),
      completedMinutes: todaySessions.reduce((sum, s) => sum + s.actualMinutes, 0),
      sessions: todaySessions,
    },
    week: {
      plannedMinutes: weekSessions.reduce((sum, s) => sum + s.plannedMinutes, 0),
      completedMinutes: weekSessions.reduce((sum, s) => sum + s.actualMinutes, 0),
      plannedSessions: weekSessions.length,
      completedSessions: weekSessions.filter((s) => s.status === 'completed').length,
      completionRate: completionRate(completed.length, eligible.length),
      daily: weekDates.map((date) => weekDaily.get(date)!),
    },
    nextSession: weekSessions.find((s) => s.startsAt >= now && (s.status === 'planned' || s.status === 'in_progress')) ?? null,
    upcomingTasks,
    deadlines: assessments.filter((a) => a.dueAt >= now - 86_400_000).slice(0, 4),
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      plannedWeekMinutes: s.stats.plannedWeekMinutes,
      studiedWeekMinutes: s.stats.studiedWeekMinutes,
      targetMinutes: s.weeklyTargetMinutes,
    })),
    needsAttention: {
      missedSessions: num(missed?.n),
      overdueTasks: tasks.filter((t) => t.dueAt !== null && t.dueAt < now).length,
      hasActivePlan: Boolean(activePlan),
    },
  }
  return reply(c, data)
})

analytics.get('/analytics', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile } = await ensureProfile(db, user)
  const timezone = profile.timezone
  const now = Date.now()
  const requested = Number(c.req.query('days'))
  const days = requested === 30 ? 30 : 7

  const today = localDate(now, timezone)
  const fromDate = DateTime.fromISO(today, { zone: timezone }).minus({ days: days - 1 })
  const from = fromDate.startOf('day').toMillis()
  const to = DateTime.fromISO(today, { zone: timezone }).plus({ days: 1 }).startOf('day').toMillis()

  const source = await subjectSource(c.env, c.get('accessToken'), user)
  const records = await subjectRecords(source, db, user.sub)
  const directory = await subjectDirectory(source, db, user.sub, records)

  const [sessions, standalone, taskRows, focusCount] = await Promise.all([
    loadSessions(db, user.sub, directory, { from, to }),
    many<{ subject_id: string | null; started_at: number; accumulated_focus_seconds: number }>(
      db,
      `SELECT subject_id, started_at, accumulated_focus_seconds FROM focus_runs
       WHERE owner_sub = ? AND study_session_id IS NULL AND status IN ('completed','abandoned') AND started_at >= ? AND started_at < ?`,
      user.sub,
      from,
      to,
    ),
    many<{ status: string; due_at: number | null }>(db, 'SELECT status, due_at FROM tasks WHERE owner_sub = ?', user.sub),
    one<{ n: number }>(db, 'SELECT COUNT(*) AS n FROM focus_runs WHERE owner_sub = ? AND started_at >= ? AND started_at < ?', user.sub, from, to),
  ])

  const daily = new Map<string, { minutes: number; planned: number }>()
  for (let i = 0; i < days; i++) {
    const date = fromDate.plus({ days: i }).toISODate()
    if (date) daily.set(date, { minutes: 0, planned: 0 })
  }

  const subjectTotals = new Map<string, { minutes: number; planned: number }>()
  const addSubject = (subjectId: string, field: 'minutes' | 'planned', value: number) => {
    const current = subjectTotals.get(subjectId) ?? { minutes: 0, planned: 0 }
    current[field] += value
    subjectTotals.set(subjectId, current)
  }

  let studyMinutes = 0
  let plannedMinutes = 0
  let completedSessions = 0
  let eligibleSessions = 0

  for (const session of sessions) {
    const plannedBucket = daily.get(localDate(session.startsAt, timezone))
    if (plannedBucket && session.status !== 'canceled') {
      plannedBucket.planned += session.plannedMinutes
      plannedMinutes += session.plannedMinutes
      addSubject(session.subjectId, 'planned', session.plannedMinutes)
    }
    if (session.actualMinutes > 0) {
      const at = session.completedAt ?? session.endsAt
      const bucket = daily.get(localDate(at, timezone))
      if (bucket) bucket.minutes += session.actualMinutes
      studyMinutes += session.actualMinutes
      addSubject(session.subjectId, 'minutes', session.actualMinutes)
    }
    if (session.endsAt < now && session.status !== 'canceled') {
      eligibleSessions++
      if (session.status === 'completed') completedSessions++
    }
  }

  for (const run of standalone) {
    const minutes = Math.round(num(run.accumulated_focus_seconds) / 60)
    if (minutes <= 0) continue
    const bucket = daily.get(localDate(num(run.started_at), timezone))
    if (bucket) bucket.minutes += minutes
    studyMinutes += minutes
    if (run.subject_id) addSubject(run.subject_id, 'minutes', minutes)
  }

  const data: AnalyticsData = {
    range: { from: fromDate.toISODate() ?? today, to: today, days },
    totals: {
      studyMinutes,
      plannedMinutes,
      completedSessions,
      eligibleSessions,
      completionRate: completionRate(completedSessions, eligibleSessions),
      focusRuns: num(focusCount?.n),
      averageSessionMinutes: completedSessions > 0 ? Math.round(studyMinutes / completedSessions) : 0,
    },
    daily: [...daily.entries()].map(([date, value]) => ({ date, minutes: value.minutes, planned: value.planned })),
    subjects: records
      .map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        minutes: subjectTotals.get(row.id)?.minutes ?? 0,
        planned: subjectTotals.get(row.id)?.planned ?? 0,
        targetMinutes: row.weeklyTargetMinutes,
      }))
      .filter((row) => row.minutes > 0 || row.planned > 0)
      .sort((a, b) => b.minutes - a.minutes),
    tasks: {
      completed: taskRows.filter((t) => t.status === 'completed').length,
      remaining: taskRows.filter((t) => t.status === 'todo' || t.status === 'in_progress').length,
      overdue: taskRows.filter((t) => t.status !== 'completed' && t.status !== 'archived' && t.due_at !== null && Number(t.due_at) < now).length,
    },
    hasData: studyMinutes > 0,
  }
  return reply(c, data)
})

/** Sessions for one subject, used by the subject detail page. */
analytics.get('/analytics/subjects/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const now = Date.now()
  const directory = await subjectDirectory(await subjectSource(c.env, c.get('accessToken'), user), db, user.sub)
  const sessions: StudySession[] = await loadSessions(db, user.sub, directory, { from: now - 30 * 86_400_000, to: now, subjectId: c.req.param('id') })
  return reply(c, {
    totals: {
      minutes: sessions.reduce((sum, s) => sum + s.actualMinutes, 0),
      planned: sessions.reduce((sum, s) => sum + s.plannedMinutes, 0),
      completed: sessions.filter((s) => s.status === 'completed').length,
      sessions: sessions.length,
    },
    recent: sessions.slice(-8).reverse(),
  })
})
