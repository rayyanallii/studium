import { DateTime } from 'luxon'

import { many, num, one } from '../db'
import { dayBounds, localDate, minutesOfDay } from './dates'

export interface AvailabilityBundle {
  rules: { weekday: number; startLocalTime: string; endLocalTime: string }[]
  overrides: { localDate: string; startLocalTime: string | null; endLocalTime: string | null; isUnavailable: boolean }[]
}

export async function loadAvailability(db: D1Database, ownerSub: string): Promise<AvailabilityBundle> {
  const [rules, overrides] = await Promise.all([
    many<{ weekday: number; start_local_time: string; end_local_time: string }>(
      db,
      'SELECT weekday, start_local_time, end_local_time FROM availability_rules WHERE owner_sub = ? ORDER BY weekday, start_local_time',
      ownerSub,
    ),
    many<{ local_date: string; start_local_time: string | null; end_local_time: string | null; is_unavailable: number }>(
      db,
      'SELECT local_date, start_local_time, end_local_time, is_unavailable FROM availability_overrides WHERE owner_sub = ?',
      ownerSub,
    ),
  ])
  return {
    rules: rules.map((row) => ({ weekday: Number(row.weekday), startLocalTime: row.start_local_time, endLocalTime: row.end_local_time })),
    overrides: overrides.map((row) => ({
      localDate: row.local_date,
      startLocalTime: row.start_local_time,
      endLocalTime: row.end_local_time,
      isUnavailable: Number(row.is_unavailable) === 1,
    })),
  }
}

/** UTC intervals available on a local calendar date. */
export function windowsForDate(date: string, timezone: string, bundle: AvailabilityBundle): { start: number; end: number }[] {
  const day = DateTime.fromISO(date, { zone: timezone })
  if (!day.isValid) return []
  const dayOverrides = bundle.overrides.filter((o) => o.localDate === date)
  if (dayOverrides.some((o) => o.isUnavailable)) return []

  const timed = dayOverrides.filter((o) => o.startLocalTime && o.endLocalTime)
  const source = timed.length > 0 ? timed : bundle.rules.filter((r) => r.weekday === day.weekday)

  return source
    .map((window) => ({
      start: day.startOf('day').plus({ minutes: minutesOfDay(window.startLocalTime!) }).toMillis(),
      end: day.startOf('day').plus({ minutes: minutesOfDay(window.endLocalTime!) }).toMillis(),
    }))
    .filter((window) => window.end > window.start)
}

/** Why a requested slot is invalid, or null when it is fine. */
export async function slotProblem(
  db: D1Database,
  ownerSub: string,
  timezone: string,
  startsAt: number,
  endsAt: number,
  excludeSessionId?: string,
  replacingPlanId?: string,
): Promise<string | null> {
  const duration = (endsAt - startsAt) / 60_000
  if (!Number.isFinite(duration) || duration < 10) return 'A session needs at least 10 minutes.'
  if (duration > 8 * 60) return 'A single session cannot be longer than 8 hours.'
  if (startsAt < Date.now() - 5 * 60_000) return 'That time is already in the past.'

  const date = localDate(startsAt, timezone)
  const bundle = await loadAvailability(db, ownerSub)
  const windows = windowsForDate(date, timezone, bundle)
  if (windows.length === 0) return 'You are not available on that day.'
  const inside = windows.some((window) => startsAt >= window.start && endsAt <= window.end)
  if (!inside) return 'That time falls outside your availability windows.'

  const params: unknown[] = [ownerSub, endsAt, startsAt]
  let sql = "SELECT COUNT(*) AS n FROM study_sessions WHERE owner_sub = ? AND status != 'canceled' AND starts_at < ? AND ends_at > ?"
  if (excludeSessionId) {
    sql += ' AND id != ?'
    params.push(excludeSessionId)
  }
  if (replacingPlanId) {
    // Sessions that accepting this plan will delete must not block its own
    // slots, otherwise every proposal is rejected against the plan it replaces.
    sql += " AND NOT (status = 'planned' AND is_locked = 0 AND starts_at > ? AND (plan_id IS NULL OR plan_id != ?))"
    params.push(Date.now(), replacingPlanId)
  }
  const conflict = await one<{ n: number }>(db, sql, ...params)
  if (num(conflict?.n) > 0) return 'This time overlaps with another study session.'
  return null
}

/** Up to `count` free slots of `durationMinutes`, searching the next week. */
export async function suggestSlots(
  db: D1Database,
  ownerSub: string,
  timezone: string,
  durationMinutes: number,
  afterMs: number,
  count = 3,
): Promise<{ startsAt: number; endsAt: number }[]> {
  const bundle = await loadAvailability(db, ownerSub)
  const out: { startsAt: number; endsAt: number }[] = []
  const duration = Math.max(10, durationMinutes)
  const grid = 15 * 60_000

  for (let offset = 0; offset < 10 && out.length < count; offset++) {
    const day = DateTime.fromMillis(afterMs, { zone: timezone }).plus({ days: offset })
    const date = day.toISODate()
    if (!date) continue
    const windows = windowsForDate(date, timezone, bundle)
    if (windows.length === 0) continue

    const bounds = dayBounds(date, timezone)
    const rows = await many<{ starts_at: number; ends_at: number }>(
      db,
      "SELECT starts_at, ends_at FROM study_sessions WHERE owner_sub = ? AND status != 'canceled' AND ends_at > ? AND starts_at < ? ORDER BY starts_at",
      ownerSub,
      bounds.start,
      bounds.end,
    )
    let free = windows.map((w) => ({ start: Math.max(w.start, afterMs), end: w.end })).filter((w) => w.end > w.start)
    for (const busy of rows) {
      const next: { start: number; end: number }[] = []
      for (const interval of free) {
        if (busy.ends_at <= interval.start || busy.starts_at >= interval.end) {
          next.push(interval)
          continue
        }
        if (busy.starts_at > interval.start) next.push({ start: interval.start, end: busy.starts_at })
        if (busy.ends_at < interval.end) next.push({ start: busy.ends_at, end: interval.end })
      }
      free = next
    }
    for (const interval of free.sort((a, b) => a.start - b.start)) {
      const start = Math.ceil(interval.start / grid) * grid
      if (start + duration * 60_000 <= interval.end) {
        out.push({ startsAt: start, endsAt: start + duration * 60_000 })
        if (out.length >= count) break
      }
    }
  }
  return out
}
