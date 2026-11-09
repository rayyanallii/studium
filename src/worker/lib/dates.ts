import { DateTime } from 'luxon'

/** 'YYYY-MM-DD' for a UTC millisecond timestamp, in the given IANA zone. */
export function localDate(timestamp: number, timezone: string): string {
  return DateTime.fromMillis(timestamp, { zone: timezone }).toISODate() ?? ''
}

/** UTC millisecond interval covering a local calendar day. */
export function dayBounds(date: string, timezone: string): { start: number; end: number } {
  const start = DateTime.fromISO(date, { zone: timezone }).startOf('day')
  return { start: start.toMillis(), end: start.plus({ days: 1 }).toMillis() }
}

/** Monday-based start of the week containing `date`. */
export function weekStart(date: string, timezone: string): string {
  return DateTime.fromISO(date, { zone: timezone }).startOf('week').toISODate() ?? date
}

export function addDays(date: string, days: number): string {
  return DateTime.fromISO(date, { zone: 'utc' }).plus({ days }).toISODate() ?? date
}

/** Minutes since local midnight for a 'HH:MM' string. */
export function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/** Local wall-clock time on `date` converted to a UTC millisecond timestamp. */
export function atLocalTime(date: string, minutes: number, timezone: string): number {
  return DateTime.fromISO(date, { zone: timezone })
    .startOf('day')
    .plus({ minutes })
    .toMillis()
}

export function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid
}

export function isValidTimezone(value: unknown): value is string {
  return typeof value === 'string' && DateTime.local().setZone(value).isValid
}

/** 'HH:MM' (24h) or null. */
export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function combineDateTime(date: string, time: string, timezone: string): number {
  return atLocalTime(date, minutesOfDay(time), timezone)
}

/** Guard against absurd or invalid timestamps coming from clients. */
export function clampTimestamp(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}
