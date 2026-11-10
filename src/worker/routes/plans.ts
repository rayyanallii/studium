import { Hono } from 'hono'
import type { Context } from 'hono'
import { DateTime } from 'luxon'
import { z } from 'zod'

import { exec, many, num, one } from '../db'
import type { AppContext, Env } from '../env'
import { AI_DEFAULTS, aiKey } from '../env'
import { isValidDate, localDate } from '../lib/dates'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { loadAvailability, slotProblem } from '../lib/availability'
import { ensureProfile, loadAssessments, loadSessions, loadTasks, expireSessions } from '../lib/rows'
import { loadSubjects, subjectDirectory, subjectSource } from '../lib/subjects'
import { aiInputFrom, generateRecommendations } from '../lib/ai'
import { MIN_FRAGMENT_MINUTES, buildSchedule, capacityByDate, validateSchedule } from '../lib/scheduler'
import type { SchedulerInput } from '../lib/scheduler'
import type { PlanProposal, ProposedSession } from '../../shared/types'

export const plans = new Hono<AppContext>()

const generateSchema = z.object({
  requestId: z.string().trim().min(8, 'A request id is required.').max(120),
  startDate: z.string().nullish(),
  horizonDays: z.number().int().min(1).max(31).nullish(),
  subjectIds: z.array(z.string()).max(40).nullish(),
  planningStyle: z.enum(['balanced', 'deadline', 'difficult']).nullish(),
  useAi: z.boolean().optional(),
})

type PlanRow = {
  id: string
  start_date: string
  end_date: string
  version: number
  status: string
  generation_source: string
  explanation: string | null
  summary: string | null
  payload: string
  warnings: string | null
  totals: string | null
  created_at: number
  accepted_at: number | null
}

interface PlanPayload {
  sessions: ProposedSession[]
  allocations: PlanProposal['allocations']
  warnings: string[]
  suggestions: string[]
  unscheduled: PlanProposal['unscheduled']
  totals: PlanProposal['totals']
  complete: boolean
  summary: string
  explanation: string
}

function readPayload(row: PlanRow): PlanPayload {
  try {
    const parsed = JSON.parse(row.payload) as Partial<PlanPayload>
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      allocations: Array.isArray(parsed.allocations) ? parsed.allocations : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      unscheduled: Array.isArray(parsed.unscheduled) ? parsed.unscheduled : [],
      totals: parsed.totals ?? { requestedMinutes: 0, availableMinutes: 0, plannedMinutes: 0, unscheduledMinutes: 0 },
      complete: Boolean(parsed.complete),
      summary: parsed.summary ?? row.summary ?? '',
      explanation: parsed.explanation ?? row.explanation ?? '',
    }
  } catch {
    return {
      sessions: [],
      allocations: [],
      warnings: ['This plan could not be read. Generate a new plan.'],
      suggestions: [],
      unscheduled: [],
      totals: { requestedMinutes: 0, availableMinutes: 0, plannedMinutes: 0, unscheduledMinutes: 0 },
      complete: false,
      summary: '',
      explanation: '',
    }
  }
}

function mapPlan(row: PlanRow): PlanProposal {
  const payload = readPayload(row)
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    version: num(row.version, 1),
    status: row.status as PlanProposal['status'],
    generationSource: (row.generation_source === 'ai' ? 'ai' : 'heuristic') as PlanProposal['generationSource'],
    summary: payload.summary,
    explanation: payload.explanation,
    sessions: payload.sessions,
    allocations: payload.allocations,
    warnings: payload.warnings,
    suggestions: payload.suggestions,
    unscheduled: payload.unscheduled,
    totals: payload.totals,
    complete: payload.complete,
    createdAt: num(row.created_at),
    acceptedAt: row.accepted_at === null ? null : num(row.accepted_at),
  }
}

interface PlanningContext {
  input: SchedulerInput
  subjectNames: Map<string, string>
  subjectColors: Map<string, string>
  assessments: { subjectId: string; title: string; dueAt: number }[]
  timezone: string
}

async function gather(c: Context<AppContext>, options: z.infer<typeof generateSchema>): Promise<PlanningContext> {
  const user = c.get('user')
  const db = c.get('db')
  const { profile, prefs } = await ensureProfile(db, user)
  const timezone = profile.timezone
  const now = Date.now()
  const today = localDate(now, timezone)
  const requestedStart = options.startDate && isValidDate(options.startDate) ? options.startDate : today
  const startDate = requestedStart < today ? today : requestedStart
  const horizonDays = options.horizonDays ?? prefs.planning_horizon_days

  const source = await subjectSource(c.env, c.get('accessToken'), user)
  const directory = await subjectDirectory(source, db, user.sub)
  const allSubjects = await loadSubjects(db, user.sub, timezone, now, source)
  const subjects = options.subjectIds?.length ? allSubjects.filter((s) => options.subjectIds!.includes(s.id)) : allSubjects

  const allTasks = await loadTasks(db, user.sub, now, directory, { openOnly: true })
  const tasks = allTasks
    .filter((task) => subjects.some((s) => s.id === task.subjectId))
    .filter((task) => task.estimatedMinutes - task.completedMinutes >= 10)
    .map((task) => ({
      id: task.id,
      subjectId: task.subjectId,
      title: task.title,
      priority: task.priority,
      dueAt: task.dueAt,
      estimatedMinutes: task.estimatedMinutes,
      completedMinutes: task.completedMinutes,
    }))

  const availability = await loadAvailability(db, user.sub)
  const assessments = (await loadAssessments(db, user.sub, directory)).filter((a) => a.dueAt >= now - 86_400_000 && subjects.some((s) => s.id === a.subjectId))

  const existing = await many<{ starts_at: number; ends_at: number }>(
    db,
    `SELECT starts_at, ends_at FROM study_sessions
     WHERE owner_sub = ? AND ends_at > ? AND (status IN ('completed','in_progress') OR is_locked = 1)`,
    user.sub,
    DateTime.fromISO(startDate, { zone: timezone }).startOf('day').toMillis() - 86_400_000,
  )

  const input: SchedulerInput = {
    timezone,
    startDate,
    horizonDays,
    now,
    preferences: {
      preferredSessionMinutes: prefs.preferred_session_minutes,
      breakMinutes: prefs.break_minutes,
      maxDailyMinutes: prefs.max_daily_minutes,
      planningStyle: (options.planningStyle ?? prefs.planning_style) as SchedulerInput['preferences']['planningStyle'],
      urgentFirst: prefs.urgent_first === 1,
    },
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      priority: s.priority,
      difficulty: s.difficulty,
      weeklyTargetMinutes: s.weeklyTargetMinutes,
      studiedWeekMinutes: s.stats.studiedWeekMinutes,
    })),
    tasks,
    availability: availability.rules,
    overrides: availability.overrides,
    existingSessions: existing.map((row) => ({ startsAt: Number(row.starts_at), endsAt: Number(row.ends_at) })),
  }

  return {
    input,
    subjectNames: new Map(subjects.map((s) => [s.id, s.name])),
    subjectColors: new Map(subjects.map((s) => [s.id, s.color])),
    assessments: assessments.map((a) => ({ subjectId: a.subjectId, title: a.title, dueAt: a.dueAt })),
    timezone,
  }
}

async function aiUsedToday(db: D1Database, ownerSub: string): Promise<number> {
  const dayStart = DateTime.utc().startOf('day').toMillis()
  const row = await one<{ n: number }>(
    db,
    "SELECT COUNT(*) AS n FROM ai_generation_usage WHERE owner_sub = ? AND status = 'success' AND created_at >= ?",
    ownerSub,
    dayStart,
  )
  return num(row?.n)
}

function dailyLimit(env: Env): number {
  const parsed = Number(env.AI_DAILY_LIMIT)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : AI_DEFAULTS.dailyLimit
}

const generateHandler = async (c: Context<AppContext>) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, generateSchema)
  if (isResponse(parsed)) return parsed

  // Idempotency: the same request id returns the same proposal.
  const prior = await one<PlanRow>(db, 'SELECT * FROM study_plans WHERE owner_sub = ? AND request_id = ?', user.sub, parsed.requestId)
  if (prior) return reply(c, mapPlan(prior))

  const context = await gather(c, parsed)
  const { input } = context
  if (input.subjects.length === 0) {
    return reply(c, {
      proposal: null,
      reason: 'no_work',
      message: 'Add a subject before generating a plan.',
    })
  }
  // Without tasks, unmet weekly targets are the work the scheduler plans.
  const hasTargetWork = input.subjects.some((s) => (s.weeklyTargetMinutes ?? 0) - s.studiedWeekMinutes >= MIN_FRAGMENT_MINUTES)
  if (input.tasks.length === 0 && !hasTargetWork) {
    return reply(c, {
      proposal: null,
      reason: 'no_work',
      message: 'Nothing to schedule yet. Add a task, or set a weekly target on a subject, then generate again.',
    })
  }

  const capacity = capacityByDate(input)
  const warnings: string[] = []
  let generationSource: 'ai' | 'heuristic' = 'heuristic'
  let summary = ''
  let explanation = ''
  let hints: SchedulerInput['aiHints'] = []

  const wantsAi = parsed.useAi !== false
  if (!wantsAi) warnings.push('AI recommendations were skipped for this plan; Studium prioritised your work deterministically.')
  else if (!aiKey(c.env)) warnings.push('AI suggestions are temporarily unavailable. You can still create a schedule using your existing tasks and availability.')
  else if ((await aiUsedToday(db, user.sub)) >= dailyLimit(c.env)) {
    warnings.push(`You have used today's ${dailyLimit(c.env)} AI recommendations. This plan was built deterministically; everything else works the same.`)
  } else {
    const recommendation = await generateRecommendations(c.env, aiInputFrom(input, capacity, context.assessments))
    if (recommendation) {
      generationSource = 'ai'
      summary = recommendation.summary
      warnings.push(...recommendation.warnings)
      hints = recommendation.hints
      if (recommendation.allocations.length > 0) {
        const allocationText = recommendation.allocations
          .slice(0, 4)
          .map((a) => `${context.subjectNames.get(a.subjectId) ?? 'Subject'} ${Math.round(a.percentage)}%`)
          .join(', ')
        explanation = `Suggested emphasis: ${allocationText}.`
      }
      await db
        .prepare('INSERT OR IGNORE INTO ai_generation_usage (id, owner_sub, generation_type, status, request_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), user.sub, 'plan', 'success', `${parsed.requestId}:ai`, Date.now())
        .run()
      console.log('ai plan', { model: recommendation.model, tokens: recommendation.usage.totalTokens, hints: hints.length })
    } else {
      warnings.push('AI suggestions are temporarily unavailable. You can still create a schedule using your existing tasks and availability.')
      await db
        .prepare('INSERT OR IGNORE INTO ai_generation_usage (id, owner_sub, generation_type, status, request_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), user.sub, 'plan', 'failed', `${parsed.requestId}:ai`, Date.now())
        .run()
    }
  }

  const scheduled = buildSchedule({ ...input, aiHints: hints })
  const checked = validateSchedule(scheduled.sessions, input)
  if (checked.problems.length > 0) {
    warnings.push('Some sessions were removed because they conflicted with your availability or daily limit.')
    console.warn('scheduler validation', checked.problems.slice(0, 5))
  }

  const sessionCount = checked.valid.length
  const uniqueSubjects = new Set(checked.valid.map((s) => s.subjectId)).size
  const fallbackSummary = sessionCount
    ? `Planned ${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} across ${uniqueSubjects} ${uniqueSubjects === 1 ? 'subject' : 'subjects'}.`
    : 'No sessions could be placed with the current availability.'
  const explanationText = `${scheduled.complete ? `${summary || fallbackSummary} Everything fits into your available time.` : `${summary || fallbackSummary} ${scheduled.totals.unscheduledMinutes} minutes of work could not be placed.`} ${explanation}`

  const payload: PlanPayload = {
    sessions: checked.valid,
    allocations: scheduled.allocations,
    warnings: [...new Set([...warnings, ...scheduled.warnings])],
    suggestions: scheduled.suggestions,
    unscheduled: scheduled.unscheduled,
    totals: { ...scheduled.totals, plannedMinutes: checked.valid.reduce((sum, s) => sum + s.plannedMinutes, 0) },
    complete: scheduled.complete && checked.problems.length === 0,
    summary: summary || fallbackSummary,
    explanation: explanationText.trim(),
  }

  const versionRow = await one<{ v: number }>(db, 'SELECT COALESCE(MAX(version), 0) + 1 AS v FROM study_plans WHERE owner_sub = ?', user.sub)
  const planId = crypto.randomUUID()
  const now = Date.now()
  const endDate = DateTime.fromISO(input.startDate, { zone: context.timezone }).plus({ days: input.horizonDays - 1 }).toISODate() ?? input.startDate

  await db.batch([
    db.prepare("DELETE FROM study_plans WHERE owner_sub = ? AND status IN ('proposed','discarded')").bind(user.sub),
    db
      .prepare(
        `INSERT INTO study_plans (id, owner_sub, start_date, end_date, version, status, generation_source, explanation, summary, payload, warnings, totals, request_id, created_at)
         VALUES (?, ?, ?, ?, ?, 'proposed', ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        planId,
        user.sub,
        input.startDate,
        endDate,
        num(versionRow?.v, 1),
        generationSource,
        payload.explanation,
        payload.summary,
        JSON.stringify(payload),
        JSON.stringify(payload.warnings),
        JSON.stringify(payload.totals),
        parsed.requestId,
        now,
      ),
  ])

  const row = await one<PlanRow>(db, 'SELECT * FROM study_plans WHERE id = ? AND owner_sub = ?', planId, user.sub)
  return reply(c, { proposal: row ? mapPlan(row) : null })
}

plans.post('/generate', generateHandler)

// Replanning is generation that preserves completed and locked sessions;
// generation already does exactly that, so both endpoints share a handler.
plans.post('/replan', generateHandler)

plans.get('/active', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  await expireSessions(db, user.sub, Date.now())
  const row = await one<PlanRow>(db, "SELECT * FROM study_plans WHERE owner_sub = ? AND status = 'active' ORDER BY accepted_at DESC LIMIT 1", user.sub)
  if (!row) return reply(c, { plan: null, sessions: [] })
  const directory = await subjectDirectory(await subjectSource(c.env, c.get('accessToken'), user), db, user.sub)
  const sessions = await loadSessions(db, user.sub, directory, { from: Date.now() - 7 * 86_400_000, to: Date.now() + 45 * 86_400_000 })
  return reply(c, {
    plan: {
      id: row.id,
      startDate: row.start_date,
      endDate: row.end_date,
      version: row.version,
      status: row.status,
      generationSource: row.generation_source,
      explanation: row.explanation,
      createdAt: Number(row.created_at),
      acceptedAt: row.accepted_at === null ? null : Number(row.accepted_at),
    },
    sessions: sessions.filter((s) => s.planId === row.id || s.isLocked),
  })
})

plans.post('/:id/accept', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile } = await ensureProfile(db, user)
  const planId = c.req.param('id')
  const row = await one<PlanRow>(db, 'SELECT * FROM study_plans WHERE id = ? AND owner_sub = ?', planId, user.sub)
  if (!row) return fail(c, 404, 'not_found', 'That plan proposal no longer exists.')
  if (row.status === 'active') {
    return reply(c, { plan: mapPlan(row), accepted: true })
  }
  if (row.status !== 'proposed') return fail(c, 409, 'plan_closed', 'This proposal is no longer available. Generate a new plan.')

  const payload = readPayload(row)
  const kept: ProposedSession[] = []
  const dropped: string[] = []
  for (const session of payload.sessions) {
    const problem = await slotProblem(db, user.sub, profile.timezone, session.startsAt, session.endsAt, undefined, planId)
    if (problem) {
      dropped.push(problem)
      continue
    }
    kept.push(session)
  }
  if (dropped.length > 0) {
    payload.warnings.push(`${dropped.length} ${dropped.length === 1 ? 'session was' : 'sessions were'} dropped because your calendar changed. Replan to fill the gap.`)
  }
  payload.sessions = kept
  payload.totals.plannedMinutes = kept.reduce((sum, s) => sum + s.plannedMinutes, 0)

  const now = Date.now()
  const statements: D1PreparedStatement[] = [
    db.prepare("UPDATE study_plans SET status = 'superseded' WHERE owner_sub = ? AND status = 'active' AND id != ?").bind(user.sub, planId),
    db
      .prepare("DELETE FROM study_sessions WHERE owner_sub = ? AND status = 'planned' AND is_locked = 0 AND starts_at > ? AND (plan_id IS NULL OR plan_id != ?)")
      .bind(user.sub, now, planId),
  ]

  for (const session of kept) {
    statements.push(
      db
        .prepare(
          `INSERT INTO study_sessions (id, owner_sub, plan_id, subject_id, task_id, title, starts_at, ends_at, planned_minutes, actual_minutes, status, is_locked, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'planned', 0, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          user.sub,
          planId,
          session.subjectId,
          session.taskId,
          session.title,
          session.startsAt,
          session.endsAt,
          session.plannedMinutes,
          now,
          now,
        ),
    )
  }
  statements.push(
    db
      .prepare("UPDATE study_plans SET status = 'active', accepted_at = ?, payload = ?, warnings = ? WHERE id = ? AND owner_sub = ?")
      .bind(now, JSON.stringify(payload), JSON.stringify(payload.warnings), planId, user.sub),
  )

  for (let i = 0; i < statements.length; i += 50) {
    await db.batch(statements.slice(i, i + 50))
  }

  const accepted = await one<PlanRow>(db, 'SELECT * FROM study_plans WHERE id = ? AND owner_sub = ?', planId, user.sub)
  const directory = await subjectDirectory(await subjectSource(c.env, c.get('accessToken'), user), db, user.sub)
  const sessions = await loadSessions(db, user.sub, directory, { from: now - 86_400_000, to: now + 45 * 86_400_000 })
  return reply(c, { plan: accepted ? mapPlan(accepted) : null, sessions: sessions.filter((s) => s.planId === planId || s.isLocked), dropped: dropped.length })
})

plans.post('/:id/discard', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const planId = c.req.param('id')
  const row = await one<PlanRow>(db, 'SELECT * FROM study_plans WHERE id = ? AND owner_sub = ?', planId, user.sub)
  if (!row) return fail(c, 404, 'not_found', 'That plan proposal no longer exists.')
  if (row.status !== 'proposed') return fail(c, 409, 'plan_closed', 'Only a pending proposal can be discarded.')
  await exec(db, "UPDATE study_plans SET status = 'discarded' WHERE id = ? AND owner_sub = ?", planId, user.sub)
  return reply(c, { discarded: true })
})

plans.get('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const rows = await many<PlanRow>(db, 'SELECT * FROM study_plans WHERE owner_sub = ? ORDER BY created_at DESC LIMIT 8', user.sub)
  return reply(c, { items: rows.map((row) => ({ id: row.id, startDate: row.start_date, endDate: row.end_date, version: row.version, status: row.status, generationSource: row.generation_source, summary: row.summary, createdAt: Number(row.created_at), acceptedAt: row.accepted_at === null ? null : Number(row.accepted_at) })) })
})
