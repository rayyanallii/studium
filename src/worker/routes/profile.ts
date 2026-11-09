import { Hono } from 'hono'
import { z } from 'zod'

import type { AppContext } from '../env'
import { aiModel, aiKey } from '../env'
import { num, one } from '../db'
import { dayBounds, isValidTimezone, localDate } from '../lib/dates'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { ensureProfile, mapPreferences, mapProfile } from '../lib/rows'
import { ACADEMIC_CONTEXTS } from '../../shared/types'
import type { Me } from '../../shared/types'
import { authMode } from '../auth'

export const profile = new Hono<AppContext>()

profile.get('/me', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile: row, prefs } = await ensureProfile(db, user)
  const now = Date.now()
  const today = localDate(now, row.timezone)
  const bounds = dayBounds(today, row.timezone)

  const counts = await one<{ subjects: number; open_tasks: number; today_sessions: number }>(
    db,
    `SELECT
      (SELECT COUNT(*) FROM subjects WHERE owner_sub = ? AND deleted_at IS NULL) AS subjects,
      (SELECT COUNT(*) FROM tasks WHERE owner_sub = ? AND status IN ('todo','in_progress')) AS open_tasks,
      (SELECT COUNT(*) FROM study_sessions WHERE owner_sub = ? AND starts_at >= ? AND starts_at < ? AND status != 'canceled') AS today_sessions`,
    user.sub,
    user.sub,
    user.sub,
    bounds.start,
    bounds.end,
  )

  const me: Me = {
    user: { sub: user.sub, name: user.name, email: user.email, picture: user.picture },
    profile: mapProfile(row),
    preferences: mapPreferences(prefs),
    capabilities: {
      database: true,
      auth: authMode(c.env, c.req.raw) as Me['capabilities']['auth'],
      ai: Boolean(aiKey(c.env)),
      aiModel: aiModel(c.env),
    },
    counts: {
      subjects: num(counts?.subjects),
      openTasks: num(counts?.open_tasks),
      todaySessions: num(counts?.today_sessions),
    },
  }
  return reply(c, me)
})

const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Add a display name.').max(60).optional(),
  academicContext: z
    .enum(ACADEMIC_CONTEXTS.map((item) => item.value) as [string, ...string[]])
    .nullish(),
  learningGoal: z.string().trim().max(400).nullish(),
  timezone: z.string().refine(isValidTimezone, 'Choose a valid timezone.').optional(),
  onboardingStep: z.number().int().min(1).max(6).optional(),
  onboardingCompleted: z.boolean().optional(),
})

profile.patch('/me', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, profileSchema)
  if (isResponse(parsed)) return parsed
  const { profile: row } = await ensureProfile(db, user)

  const next = {
    displayName: parsed.displayName ?? row.display_name,
    academicContext: parsed.academicContext === undefined ? row.academic_context : parsed.academicContext,
    learningGoal: parsed.learningGoal === undefined ? row.learning_goal : parsed.learningGoal,
    timezone: parsed.timezone ?? row.timezone,
    onboardingStep: parsed.onboardingStep ?? row.onboarding_step,
    onboardingCompleted: parsed.onboardingCompleted === undefined ? row.onboarding_completed : parsed.onboardingCompleted ? 1 : 0,
  }
  await db
    .prepare(
      `UPDATE profiles SET display_name = ?, academic_context = ?, learning_goal = ?, timezone = ?, onboarding_step = ?, onboarding_completed = ?, updated_at = ?
       WHERE owner_sub = ?`,
    )
    .bind(next.displayName, next.academicContext ?? null, next.learningGoal ?? null, next.timezone, next.onboardingStep, next.onboardingCompleted, Date.now(), user.sub)
    .run()

  const fresh = await one<typeof row>(db, 'SELECT * FROM profiles WHERE owner_sub = ?', user.sub)
  return reply(c, { profile: mapProfile(fresh ?? row) })
})

const preferencesSchema = z.object({
  preferredSessionMinutes: z.number().int().min(15).max(120).optional(),
  breakMinutes: z.number().int().min(0).max(45).optional(),
  maxDailyMinutes: z.number().int().min(30).max(720).optional(),
  planningHorizonDays: z.number().int().min(1).max(31).optional(),
  planningStyle: z.enum(['balanced', 'deadline', 'difficult']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  urgentFirst: z.boolean().optional(),
})

profile.patch('/me/preferences', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, preferencesSchema)
  if (isResponse(parsed)) return parsed
  const { prefs } = await ensureProfile(db, user)

  const next = {
    preferredSessionMinutes: parsed.preferredSessionMinutes ?? prefs.preferred_session_minutes,
    breakMinutes: parsed.breakMinutes ?? prefs.break_minutes,
    maxDailyMinutes: parsed.maxDailyMinutes ?? prefs.max_daily_minutes,
    planningHorizonDays: parsed.planningHorizonDays ?? prefs.planning_horizon_days,
    planningStyle: parsed.planningStyle ?? prefs.planning_style,
    theme: parsed.theme ?? prefs.theme,
    urgentFirst: parsed.urgentFirst === undefined ? prefs.urgent_first : parsed.urgentFirst ? 1 : 0,
  }
  await db
    .prepare(
      `UPDATE study_preferences SET preferred_session_minutes = ?, break_minutes = ?, max_daily_minutes = ?, planning_horizon_days = ?, planning_style = ?, theme = ?, urgent_first = ?, updated_at = ?
       WHERE owner_sub = ?`,
    )
    .bind(
      next.preferredSessionMinutes,
      next.breakMinutes,
      next.maxDailyMinutes,
      next.planningHorizonDays,
      next.planningStyle,
      next.theme,
      next.urgentFirst,
      Date.now(),
      user.sub,
    )
    .run()

  const fresh = await one<typeof prefs>(db, 'SELECT * FROM study_preferences WHERE owner_sub = ?', user.sub)
  return reply(c, { preferences: mapPreferences(fresh ?? prefs) })
})

profile.delete('/account', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  if (c.req.query('confirm') !== 'delete') {
    return fail(c, 400, 'confirmation_required', 'Account deletion needs an explicit confirmation.')
  }
  await db.batch([
    db.prepare('DELETE FROM focus_runs WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM study_sessions WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM study_plans WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM ai_generation_usage WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM availability_rules WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM availability_overrides WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM assessments WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM tasks WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM topics WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM subjects WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM study_preferences WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM profiles WHERE owner_sub = ?').bind(user.sub),
    db.prepare('DELETE FROM users WHERE owner_sub = ?').bind(user.sub),
  ])
  return reply(c, { deleted: true })
})
