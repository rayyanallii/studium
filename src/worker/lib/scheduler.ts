// Deterministic study scheduler.
//
// The AI layer only ranks work and suggests durations; every timestamp below is
// produced here, so a generated plan can be proven to respect availability,
// break time, daily limits and deadlines. Times are computed in the user's IANA
// zone with Luxon (DST-safe) and emitted as UTC milliseconds.

import { DateTime } from 'luxon'

import type { PlanningStyle, Priority } from '../../shared/types'

export const GRID_MINUTES = 15
export const MIN_SESSION_MINUTES = 25
export const MAX_SESSION_MINUTES = 90
export const MIN_FRAGMENT_MINUTES = 10
const GRID_MS = GRID_MINUTES * 60_000

export interface SchedulerSubject {
  id: string
  name: string
  color: string
  priority: Priority
  difficulty: number
  weeklyTargetMinutes: number | null
  studiedWeekMinutes: number
}

export interface SchedulerTask {
  id: string
  subjectId: string
  title: string
  priority: Priority
  dueAt: number | null
  estimatedMinutes: number
  completedMinutes: number
}

export interface SchedulerAvailability {
  weekday: number
  startLocalTime: string
  endLocalTime: string
}

export interface SchedulerOverride {
  localDate: string
  startLocalTime: string | null
  endLocalTime: string | null
  isUnavailable: boolean
}

export interface ExistingSession {
  startsAt: number
  endsAt: number
}

export interface AiHint {
  taskId: string
  priority: number
  estimatedMinutes: number | null
}

export interface SchedulerInput {
  timezone: string
  startDate: string
  horizonDays: number
  now: number
  preferences: {
    preferredSessionMinutes: number
    breakMinutes: number
    maxDailyMinutes: number
    planningStyle: PlanningStyle
    urgentFirst: boolean
  }
  subjects: SchedulerSubject[]
  tasks: SchedulerTask[]
  availability: SchedulerAvailability[]
  overrides: SchedulerOverride[]
  existingSessions: ExistingSession[]
  aiHints?: AiHint[]
}

export interface ScheduledSession {
  key: string
  subjectId: string
  taskId: string | null
  title: string
  startsAt: number
  endsAt: number
  plannedMinutes: number
  reason: string
}

export interface SchedulerResult {
  sessions: ScheduledSession[]
  allocations: { subjectId: string; subjectName: string; color: string; minutes: number }[]
  unscheduled: { taskId: string; title: string; subjectName: string; minutes: number }[]
  totals: { requestedMinutes: number; availableMinutes: number; plannedMinutes: number; unscheduledMinutes: number }
  warnings: string[]
  suggestions: string[]
  complete: boolean
}

const PRIORITY_WEIGHT: Record<Priority, number> = { low: 0.25, medium: 0.6, high: 1 }
const STYLE_WEIGHTS: Record<PlanningStyle, { urgency: number; priority: number; difficulty: number; shortfall: number }> = {
  balanced: { urgency: 0.4, priority: 0.25, difficulty: 0.2, shortfall: 0.15 },
  deadline: { urgency: 0.62, priority: 0.18, difficulty: 0.12, shortfall: 0.08 },
  difficult: { urgency: 0.28, priority: 0.18, difficulty: 0.42, shortfall: 0.12 },
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const ceil15 = (ms: number) => Math.ceil(ms / GRID_MS) * GRID_MS
const floorTo = (minutes: number, step = 5) => Math.floor(minutes / step) * step

function toWindows(date: string, timezone: string, availability: SchedulerAvailability[], overrides: SchedulerOverride[]) {
  const day = DateTime.fromISO(date, { zone: timezone })
  if (!day.isValid) return []
  const dateOverrides = overrides.filter((o) => o.localDate === date)

  const windows: { start: number; end: number }[] = []
  if (dateOverrides.some((o) => o.isUnavailable)) return windows

  const timed = dateOverrides.filter((o) => o.startLocalTime && o.endLocalTime)
  const source = timed.length > 0 ? timed : availability.filter((a) => a.weekday === day.weekday)

  for (const window of source) {
    const start = day.startOf('day').plus({ minutes: minutesFrom(window.startLocalTime) })
    const end = day.startOf('day').plus({ minutes: minutesFrom(window.endLocalTime) })
    if (end.toMillis() > start.toMillis()) windows.push({ start: start.toMillis(), end: end.toMillis() })
  }
  return windows
}

function minutesFrom(time: string | null): number {
  if (!time) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/** Merges overlapping windows so the same minutes are never counted twice. */
function merge(intervals: { start: number; end: number }[]) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start)
  const out: { start: number; end: number }[] = []
  for (const interval of sorted) {
    const last = out[out.length - 1]
    if (last && interval.start <= last.end) last.end = Math.max(last.end, interval.end)
    else out.push({ ...interval })
  }
  return out
}

/** Everything inside `windows` that is not consumed by an existing session. */
function freeIntervals(windows: { start: number; end: number }[], busy: { start: number; end: number }[]) {
  let free = merge(windows)
  for (const block of merge(busy)) {
    const next: { start: number; end: number }[] = []
    for (const interval of free) {
      if (block.end <= interval.start || block.start >= interval.end) {
        next.push(interval)
        continue
      }
      if (block.start > interval.start) next.push({ start: interval.start, end: block.start })
      if (block.end < interval.end) next.push({ start: block.end, end: interval.end })
    }
    free = next
  }
  return free.filter((i) => i.end - i.start >= MIN_FRAGMENT_MINUTES * 60_000)
}

interface Candidate {
  task: SchedulerTask
  subject: SchedulerSubject
  remaining: number
  score: number
  deadline: number | null
  /** Derived from a subject's weekly target rather than a real task. */
  synthetic?: boolean
}

function scoreFor(candidate: Omit<Candidate, 'score'>, input: SchedulerInput, horizonEnd: number): number {
  const weights = STYLE_WEIGHTS[input.preferences.planningStyle]
  const urgency = candidate.deadline
    ? candidate.deadline <= input.now
      ? 1
      : clamp(1 - (candidate.deadline - input.now) / Math.max(1, horizonEnd - input.now), 0.08)
    : 0.1
  const priority = PRIORITY_WEIGHT[candidate.task.priority]
  const difficulty = clamp(candidate.subject.difficulty / 5)
  const shortfall = candidate.subject.weeklyTargetMinutes
    ? clamp(1 - candidate.subject.studiedWeekMinutes / Math.max(1, candidate.subject.weeklyTargetMinutes))
    : 0
  const base =
    weights.urgency * urgency +
    weights.priority * priority +
    weights.difficulty * difficulty +
    weights.shortfall * shortfall
  const hint = input.aiHints?.find((h) => h.taskId === candidate.task.id)
  const aiBoost = hint ? clamp(hint.priority / 100) * 0.25 : 0
  return base + aiBoost
}

function reasonFor(candidate: Candidate, input: SchedulerInput): string {
  if (candidate.deadline && candidate.deadline <= input.now) return 'Past due, scheduled first'
  if (candidate.deadline) {
    const days = Math.max(0, Math.round((candidate.deadline - input.now) / 86_400_000))
    return days <= 1 ? 'Due tomorrow' : `Due in ${days} days`
  }
  if (candidate.subject.weeklyTargetMinutes) return 'Weekly subject target'
  return input.preferences.planningStyle === 'difficult' ? 'High difficulty subject' : 'Balanced coverage'
}

export function buildSchedule(input: SchedulerInput): SchedulerResult {
  const timezone = input.timezone
  const horizon = Math.max(1, Math.min(31, input.horizonDays))
  const start = DateTime.fromISO(input.startDate, { zone: timezone })
  const dayList: string[] = []
  for (let i = 0; i < horizon; i++) {
    const date = start.plus({ days: i }).toISODate()
    if (date) dayList.push(date)
  }
  const horizonEnd = start.plus({ days: horizon }).endOf('day').toMillis()

  const subjectsById = new Map(input.subjects.map((s) => [s.id, s]))
  const hintsById = new Map((input.aiHints ?? []).map((h) => [h.taskId, h]))

  // Work units use the AI's duration estimate only when it is a modest change.
  const candidates: Candidate[] = []
  for (const task of input.tasks) {
    const subject = subjectsById.get(task.subjectId)
    if (!subject) continue
    const hint = hintsById.get(task.id)
    let estimate = Math.max(0, task.estimatedMinutes)
    if (hint?.estimatedMinutes) {
      const suggested = hint.estimatedMinutes
      if (suggested >= 10 && suggested <= 300 && Math.abs(suggested - estimate) <= Math.max(30, estimate * 0.4)) {
        estimate = suggested
      }
    }
    const remaining = Math.max(0, estimate - Math.max(0, task.completedMinutes))
    if (remaining < MIN_FRAGMENT_MINUTES) continue
    const candidate: Candidate = { task, subject, remaining, score: 0, deadline: task.dueAt }
    candidate.score = scoreFor(candidate, input, horizonEnd)
    candidates.push(candidate)
  }

  // Nothing actionable captured as tasks yet: a subject's weekly target still
  // describes real study time, so plan blocks against the unmet target.
  if (candidates.length === 0) {
    for (const subject of input.subjects) {
      if (!subject.weeklyTargetMinutes) continue
      const remaining = Math.max(0, subject.weeklyTargetMinutes - subject.studiedWeekMinutes)
      if (remaining < MIN_FRAGMENT_MINUTES) continue
      const task: SchedulerTask = {
        id: '',
        subjectId: subject.id,
        title: `Study ${subject.name}`,
        priority: subject.priority,
        dueAt: null,
        estimatedMinutes: remaining,
        completedMinutes: 0,
      }
      const candidate: Candidate = { task, subject, remaining, score: 0, deadline: null, synthetic: true }
      candidate.score = scoreFor(candidate, input, horizonEnd)
      candidates.push(candidate)
    }
  }

  const requestedMinutes = candidates.reduce((sum, c) => sum + c.remaining, 0)
  const sessions: ScheduledSession[] = []
  const busy: { start: number; end: number }[] = input.existingSessions.map((s) => ({ start: s.startsAt, end: s.endsAt }))
  let availableMinutes = 0
  const subjectDayCount = new Map<string, number>()
  let lastSubjectId: string | null = null

  const { preferredSessionMinutes, breakMinutes, maxDailyMinutes } = input.preferences
  const preferred = Math.max(MIN_SESSION_MINUTES, Math.min(MAX_SESSION_MINUTES, Math.round(preferredSessionMinutes / 5) * 5))
  const breakMs = Math.max(0, breakMinutes) * 60_000
  const dailyCap = Math.max(MIN_SESSION_MINUTES, Math.min(16 * 60, maxDailyMinutes))

  for (const date of dayList) {
    const windows = toWindows(date, timezone, input.availability, input.overrides)
    if (windows.length === 0) continue

    const dayBounds = DateTime.fromISO(date, { zone: timezone })
    const dayStart = dayBounds.startOf('day').toMillis()
    const dayEnd = dayBounds.plus({ days: 1 }).startOf('day').toMillis()
    // Never place work in the past.
    const earliest = Math.max(dayStart, date === dayList[0] ? ceil15(input.now + 60_000) : dayStart)

    const dayBusy = busy
      .filter((b) => b.end > dayStart && b.start < dayEnd)
      .map((b) => ({ start: Math.max(b.start, dayStart), end: Math.min(b.end, dayEnd) }))
    const committed = dayBusy.reduce((sum, b) => sum + (b.end - b.start) / 60_000, 0)
    let budgetLeft = Math.max(0, dailyCap - committed)

    const clipped = windows
      .map((w) => ({ start: Math.max(w.start, earliest), end: Math.min(w.end, dayEnd) }))
      .filter((w) => w.end - w.start > 0)

    const free = freeIntervals(clipped, dayBusy)
    availableMinutes += Math.min(budgetLeft, free.reduce((sum, i) => sum + floorTo((i.end - i.start) / 60_000), 0))
    subjectDayCount.clear()

    for (const interval of free) {
      if (budgetLeft < MIN_FRAGMENT_MINUTES) break
      let cursor = ceil15(interval.start)
      // Guard against pathological loops.
      let placements = 0
      while (cursor < interval.end && budgetLeft >= MIN_FRAGMENT_MINUTES && placements < 24) {
        const room = floorTo((interval.end - cursor) / 60_000)
        if (room < MIN_FRAGMENT_MINUTES) break

        const candidatesForSlot = candidates
          .filter((c) => {
            if (c.remaining < MIN_FRAGMENT_MINUTES) return false
            if ((subjectDayCount.get(c.subject.id) ?? 0) >= 2) return false
            // Deadline-bound work must finish before the deadline.
            if (c.deadline !== null && c.deadline < cursor + MIN_FRAGMENT_MINUTES * 60_000) return false
            return true
          })
          .sort((a, b) => {
            const aToday = a.deadline !== null && a.deadline <= dayEnd ? 0 : 1
            const bToday = b.deadline !== null && b.deadline <= dayEnd ? 0 : 1
            if (aToday !== bToday) return aToday - bToday
            if (b.score !== a.score) return b.score - a.score
            return (a.deadline ?? Number.MAX_SAFE_INTEGER) - (b.deadline ?? Number.MAX_SAFE_INTEGER)
          })

        if (candidatesForSlot.length === 0) break

        // Keep subjects rotating on balanced plans instead of stacking one.
        let chosen = candidatesForSlot[0]
        if (lastSubjectId && chosen.subject.id === lastSubjectId && input.preferences.planningStyle !== 'deadline') {
          const alternative = candidatesForSlot.find((c) => c.subject.id !== lastSubjectId && c.score >= chosen.score * 0.7)
          if (alternative) chosen = alternative
        }

        const target = chosen.task.dueAt !== null ? Math.min(chosen.task.dueAt, interval.end) : interval.end
        const deadlineRoom = floorTo((target - cursor) / 60_000)
        if (deadlineRoom < MIN_FRAGMENT_MINUTES) break

        let length = floorTo(Math.min(preferred, chosen.remaining, MAX_SESSION_MINUTES, room, deadlineRoom, budgetLeft))
        if (length < MIN_SESSION_MINUTES) {
          // Only a genuine final fragment of this task may be shorter.
          if (chosen.remaining <= length && length >= MIN_FRAGMENT_MINUTES) {
            // allowed
          } else break
        }
        if (length < MIN_FRAGMENT_MINUTES) break

        const startsAt = cursor
        const endsAt = startsAt + length * 60_000
        sessions.push({
          key: `${chosen.task.id || chosen.subject.id}:${startsAt}`,
          subjectId: chosen.subject.id,
          taskId: chosen.synthetic ? null : chosen.task.id,
          title: chosen.task.title,
          startsAt,
          endsAt,
          plannedMinutes: length,
          reason: reasonFor(chosen, input),
        })
        chosen.remaining -= length
        budgetLeft -= length
        placements++
        subjectDayCount.set(chosen.subject.id, (subjectDayCount.get(chosen.subject.id) ?? 0) + 1)
        lastSubjectId = chosen.subject.id
        busy.push({ start: startsAt, end: endsAt })

        cursor = ceil15(endsAt + breakMs)
      }
    }
  }

  const plannedMinutes = sessions.reduce((sum, s) => sum + s.plannedMinutes, 0)
  const unscheduled = candidates
    .filter((c) => c.remaining >= MIN_FRAGMENT_MINUTES)
    .sort((a, b) => b.score - a.score)
    .map((c) => ({ taskId: c.synthetic ? '' : c.task.id, title: c.task.title, subjectName: c.subject.name, minutes: c.remaining }))
  const unscheduledMinutes = unscheduled.reduce((sum, u) => sum + u.minutes, 0)

  const allocationMap = new Map<string, number>()
  for (const session of sessions) allocationMap.set(session.subjectId, (allocationMap.get(session.subjectId) ?? 0) + session.plannedMinutes)
  const allocations = [...allocationMap.entries()]
    .map(([subjectId, minutes]) => {
      const subject = subjectsById.get(subjectId)!
      return { subjectId, subjectName: subject.name, color: subject.color, minutes }
    })
    .sort((a, b) => b.minutes - a.minutes)

  const warnings: string[] = []
  const suggestions: string[] = []
  if (unscheduledMinutes > 0) {
    warnings.push("Your available study time isn't enough to fit everything into this plan.")
    warnings.push(`${unscheduledMinutes} minutes (${unscheduled.length} ${unscheduled.length === 1 ? 'task' : 'tasks'}) could not be scheduled.`)
    const pastDue = candidates.filter((c) => c.deadline !== null && c.deadline < input.now && c.remaining >= MIN_FRAGMENT_MINUTES)
    if (pastDue.length > 0) warnings.push(`${pastDue.length} ${pastDue.length === 1 ? 'task is' : 'tasks are'} already past due and need attention.`)
    suggestions.push('Extend the planning period or add more availability windows.')
    suggestions.push('Lower the estimates on low-priority tasks, or move work to subjects with spare capacity.')
    if (dailyCap < 360) suggestions.push('Raise your maximum daily study time if your week allows it.')
  }
  if (sessions.length === 0) {
    if (requestedMinutes > 0) {
      warnings.push('No study sessions could be placed inside your availability windows.')
      suggestions.push('Open Settings to widen your weekly availability.')
    } else {
      warnings.push('There is nothing to schedule yet. Add a task, or set a weekly target on a subject.')
    }
  }
  if (availableMinutes < 60 && sessions.length > 0) suggestions.push('Your week has less than an hour of open capacity — small, regular sessions work better than one long one.')

  return {
    sessions,
    allocations,
    unscheduled,
    totals: { requestedMinutes, availableMinutes: Math.round(availableMinutes), plannedMinutes, unscheduledMinutes },
    warnings,
    suggestions,
    complete: unscheduledMinutes < MIN_FRAGMENT_MINUTES,
  }
}

/** Open study minutes per local date, used to brief the AI on real capacity. */
export function capacityByDate(input: SchedulerInput): { date: string; minutes: number }[] {
  const timezone = input.timezone
  const start = DateTime.fromISO(input.startDate, { zone: timezone })
  const out: { date: string; minutes: number }[] = []
  const horizon = Math.max(1, Math.min(31, input.horizonDays))
  const dailyCap = Math.max(MIN_SESSION_MINUTES, Math.min(16 * 60, input.preferences.maxDailyMinutes))

  for (let i = 0; i < horizon; i++) {
    const day = start.plus({ days: i })
    const date = day.toISODate()
    if (!date) continue
    const dayStart = day.startOf('day').toMillis()
    const dayEnd = day.plus({ days: 1 }).startOf('day').toMillis()
    const windows = toWindows(date, timezone, input.availability, input.overrides)
    const busy = input.existingSessions
      .filter((b) => b.endsAt > dayStart && b.startsAt < dayEnd)
      .map((b) => ({ start: Math.max(b.startsAt, dayStart), end: Math.min(b.endsAt, dayEnd) }))
    const committed = busy.reduce((sum, b) => sum + (b.end - b.start) / 60_000, 0)
    const free = freeIntervals(windows, busy)
    const open = free.reduce((sum, interval) => sum + floorTo((interval.end - interval.start) / 60_000), 0)
    out.push({ date, minutes: Math.max(0, Math.min(dailyCap - committed, open)) })
  }
  return out
}

/**
 * Final safety net: every proposed session is re-checked against the same hard
 * constraints the scheduler used. Anything that fails is dropped, never shown
 * as a valid plan.
 */
export function validateSchedule(sessions: ScheduledSession[], input: SchedulerInput): { valid: ScheduledSession[]; problems: string[] } {
  const problems: string[] = []
  const valid: ScheduledSession[] = []
  const timezone = input.timezone
  const dayTotals = new Map<string, number>()

  const ordered = [...sessions].sort((a, b) => a.startsAt - b.startsAt)
  let previousEnd = 0
  for (const session of ordered) {
    const date = DateTime.fromMillis(session.startsAt, { zone: timezone }).toISODate() ?? ''
    const windows = toWindows(date, timezone, input.availability, input.overrides)
    const insideWindow = windows.some((w) => session.startsAt >= w.start && session.endsAt <= w.end)
    const overlapsExisting = input.existingSessions.some((b) => session.startsAt < b.endsAt && session.endsAt > b.startsAt)
    const overlapsPlaced = session.startsAt < previousEnd
    const length = Math.round((session.endsAt - session.startsAt) / 60_000)
    const total = (dayTotals.get(date) ?? 0) + length
    const task = input.tasks.find((t) => t.id === session.taskId)

    if (!insideWindow) problems.push(`A session on ${date} fell outside your availability.`)
    else if (session.startsAt < input.now) problems.push(`A session on ${date} was in the past.`)
    else if (overlapsExisting || overlapsPlaced) problems.push(`A session on ${date} overlapped another session.`)
    else if (total > input.preferences.maxDailyMinutes) problems.push(`A session on ${date} exceeded your daily limit.`)
    else if (length > MAX_SESSION_MINUTES) problems.push(`A session on ${date} was longer than ${MAX_SESSION_MINUTES} minutes.`)
    else if (task?.dueAt != null && session.endsAt > task.dueAt) problems.push(`A session on ${date} ended after its deadline.`)
    else {
      valid.push(session)
      dayTotals.set(date, total)
      previousEnd = session.endsAt
    }
  }
  return { valid, problems: [...new Set(problems)] }
}
