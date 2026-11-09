import { Hono } from 'hono'
import { z } from 'zod'

import type { AppContext } from '../env'
import { aiModel, aiKey } from '../env'
import { num, one, many } from '../db'
import { dayBounds, isValidTimezone, localDate } from '../lib/dates'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { ensureProfile, mapPreferences, mapProfile } from '../lib/rows'
import { ensureWorkspace, findWorkspace, toWorkspaceError, workspaceClient } from '../lib/pg'
import { subjectRecords, subjectSource } from '../lib/subjects'
import { ACADEMIC_CONTEXTS } from '../../shared/types'
import type { Me, Preferences, Profile } from '../../shared/types'
import { authMode } from '../auth'

// Identity and study preferences live in Postgres (profiles, study_preferences).
// Everything else still lives in D1, so the counts below stay on D1 until those
// domains are ported — one source of truth per record, never two.

export const profile = new Hono<AppContext>()

interface ProfileRow {
  display_name: string
  academic_context: string | null
  learning_goal: string | null
  timezone: string
  onboarding_step: number
  onboarding_completed: boolean
}

interface PrefsRow {
  preferred_session_minutes: number
  break_minutes: number
  max_daily_minutes: number
  planning_horizon_days: number
  planning_style: string
  theme: string
  urgent_first: boolean
}

const PROFILE_COLUMNS = 'display_name, academic_context, learning_goal, timezone, onboarding_step, onboarding_completed'

function mapPgProfile(row: ProfileRow | null): Profile {
  return {
    displayName: row?.display_name ?? 'Student',
    academicContext: (row?.academic_context as Profile['academicContext']) ?? null,
    learningGoal: row?.learning_goal ?? null,
    timezone: row?.timezone ?? 'UTC',
    onboardingCompleted: row?.onboarding_completed ?? false,
    onboardingStep: row?.onboarding_step ?? 1,
  }
}

function mapPgPreferences(row: PrefsRow | null): Preferences {
  return {
    preferredSessionMinutes: row?.preferred_session_minutes ?? 50,
    breakMinutes: row?.break_minutes ?? 10,
    maxDailyMinutes: row?.max_daily_minutes ?? 240,
    planningHorizonDays: row?.planning_horizon_days ?? 7,
    planningStyle: (['balanced', 'deadline', 'difficult'].includes(row?.planning_style ?? '') ? row!.planning_style : 'balanced') as Preferences['planningStyle'],
    theme: (['light', 'dark', 'system'].includes(row?.theme ?? '') ? row!.theme : 'dark') as Preferences['theme'],
    urgentFirst: row?.urgent_first ?? false,
  }
}

profile.get('/me', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const pg = workspaceClient(c.env, c.get('accessToken'))

  let account: { profile: Profile; preferences: Preferences } | null = null
  if (pg) {
    try {
      const workspaceId = await ensureWorkspace(pg, user)
      const [profileResult, prefResult] = await Promise.all([
        pg.from('profiles').select(PROFILE_COLUMNS).eq('id', user.sub).maybeSingle(),
        pg.from('study_preferences').select('preferred_session_minutes, break_minutes, max_daily_minutes, planning_horizon_days, planning_style, theme, urgent_first').eq('workspace_id', workspaceId).maybeSingle(),
      ])
      if (profileResult.error) throw toWorkspaceError(profileResult.error)
      if (prefResult.error) throw toWorkspaceError(prefResult.error)
      account = {
        profile: mapPgProfile(profileResult.data as ProfileRow | null),
        preferences: mapPgPreferences(prefResult.data as PrefsRow | null),
      }
    } catch (error) {
      const workspaceError = error instanceof Error ? error : new Error('The workspace database is unavailable.')
      return fail(c, 503, 'workspace_unavailable', workspaceError.message)
    }
  } else {
    // Development identity without Supabase configured.
    const { profile: row, prefs } = await ensureProfile(db, user)
    account = { profile: mapProfile(row), preferences: mapPreferences(prefs) }
  }

  const timezone = account.profile.timezone
  const today = localDate(Date.now(), timezone)
  const bounds = dayBounds(today, timezone)

  // Subjects are Postgres records now; the remaining counts stay on D1.
  const subjectCount = (await subjectRecords(await subjectSource(c.env, c.get('accessToken'), user), db, user.sub)).length
  const counts = await one<{ open_tasks: number; today_sessions: number }>(
    db,
    `SELECT
      (SELECT COUNT(*) FROM tasks WHERE owner_sub = ? AND status IN ('todo','in_progress')) AS open_tasks,
      (SELECT COUNT(*) FROM study_sessions WHERE owner_sub = ? AND starts_at >= ? AND starts_at < ? AND status != 'canceled') AS today_sessions`,
    user.sub,
    user.sub,
    bounds.start,
    bounds.end,
  )

  const me: Me = {
    user: { sub: user.sub, name: user.name, email: user.email, picture: user.picture },
    profile: account.profile,
    preferences: account.preferences,
    capabilities: {
      database: true,
      auth: authMode(c.env, c.req.raw) as Me['capabilities']['auth'],
      ai: Boolean(aiKey(c.env)),
      aiModel: aiModel(c.env),
    },
    counts: {
      subjects: subjectCount,
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
  const pg = workspaceClient(c.env, c.get('accessToken'))
  const parsed = await parseBody(c, profileSchema)
  if (isResponse(parsed)) return parsed

  if (pg) {
    try {
      await ensureWorkspace(pg, user)
      const { data: current, error: readError } = await pg.from('profiles').select(PROFILE_COLUMNS).eq('id', user.sub).maybeSingle()
      if (readError) throw toWorkspaceError(readError)
      const row = current as ProfileRow | null

      const next = {
        display_name: parsed.displayName ?? row?.display_name ?? 'Student',
        academic_context: parsed.academicContext === undefined ? (row?.academic_context ?? null) : parsed.academicContext,
        learning_goal: parsed.learningGoal === undefined ? (row?.learning_goal ?? null) : parsed.learningGoal,
        timezone: parsed.timezone ?? row?.timezone ?? 'UTC',
        onboarding_step: parsed.onboardingStep ?? row?.onboarding_step ?? 1,
        onboarding_completed: parsed.onboardingCompleted === undefined ? (row?.onboarding_completed ?? false) : parsed.onboardingCompleted,
      }

      const { data: updated, error } = await pg.from('profiles').update(next).eq('id', user.sub).select(PROFILE_COLUMNS).single()
      if (error) throw toWorkspaceError(error)
      return reply(c, { profile: mapPgProfile(updated as ProfileRow) })
    } catch (error) {
      return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not save your profile.')
    }
  }

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

const PREF_COLUMNS = 'preferred_session_minutes, break_minutes, max_daily_minutes, planning_horizon_days, planning_style, theme, urgent_first'

profile.patch('/me/preferences', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const pg = workspaceClient(c.env, c.get('accessToken'))
  const parsed = await parseBody(c, preferencesSchema)
  if (isResponse(parsed)) return parsed

  if (pg) {
    try {
      const workspaceId = await ensureWorkspace(pg, user)
      const { data: current, error: readError } = await pg.from('study_preferences').select(PREF_COLUMNS).eq('workspace_id', workspaceId).maybeSingle()
      if (readError) throw toWorkspaceError(readError)
      const row = current as PrefsRow | null

      const next = {
        preferred_session_minutes: parsed.preferredSessionMinutes ?? row?.preferred_session_minutes ?? 50,
        break_minutes: parsed.breakMinutes ?? row?.break_minutes ?? 10,
        max_daily_minutes: parsed.maxDailyMinutes ?? row?.max_daily_minutes ?? 240,
        planning_horizon_days: parsed.planningHorizonDays ?? row?.planning_horizon_days ?? 7,
        planning_style: parsed.planningStyle ?? row?.planning_style ?? 'balanced',
        theme: parsed.theme ?? row?.theme ?? 'dark',
        urgent_first: parsed.urgentFirst === undefined ? (row?.urgent_first ?? false) : parsed.urgentFirst,
      }

      const { data: updated, error } = await pg.from('study_preferences').update(next).eq('workspace_id', workspaceId).select(PREF_COLUMNS).single()
      if (error) throw toWorkspaceError(error)
      return reply(c, { preferences: mapPgPreferences(updated as PrefsRow) })
    } catch (error) {
      return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not save your preferences.')
    }
  }

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
  const pg = workspaceClient(c.env, c.get('accessToken'))
  if (c.req.query('confirm') !== 'delete') {
    return fail(c, 400, 'confirmation_required', 'Account deletion needs an explicit confirmation.')
  }

  if (pg) {
    try {
      const workspaceId = await findWorkspace(pg, user)
      if (workspaceId) {
        // Deleting the workspace cascades every workspace-owned table.
        const { error } = await pg.from('workspaces').delete().eq('id', workspaceId)
        if (error) throw toWorkspaceError(error)
      }
      const { error: profileError } = await pg.from('profiles').delete().eq('id', user.sub)
      if (profileError) throw toWorkspaceError(profileError)
    } catch (error) {
      return fail(c, 503, 'workspace_unavailable', error instanceof Error ? error.message : 'Could not delete your workspace data.')
    }
  }

  // Remaining domains still live in D1 until they are ported.
  const files = await many<{ object_key: string }>(db, 'SELECT object_key FROM study_materials WHERE owner_sub = ? AND object_key IS NOT NULL', user.sub)
  if (c.env.FILES && files.length) await c.env.FILES.delete(files.map((file) => file.object_key))
  await db.batch([
    ...['flashcard_reviews', 'notebook_messages', 'quiz_attempts', 'study_artifacts', 'study_materials'].map((table) => db.prepare(`DELETE FROM ${table} WHERE owner_sub = ?`).bind(user.sub)),
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
