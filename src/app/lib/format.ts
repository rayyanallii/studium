import { DateTime } from 'luxon'

export function minutesLabel(total: number): string {
  const minutes = Math.max(0, Math.round(total))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

export function clockTime(ts: number, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(ts)
}

export function timeRange(start: number, end: number, timezone?: string): string {
  return `${clockTime(start, timezone)} – ${clockTime(end, timezone)}`
}

export function localDateKey(ts: number, timezone?: string): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone }).format(ts)
}

export function dateLabel(date: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }): string {
  const parsed = DateTime.fromISO(date)
  return parsed.isValid ? parsed.toLocaleString(options) : date
}

export function dayLabel(date: string): string {
  const parsed = DateTime.fromISO(date)
  if (!parsed.isValid) return date
  const today = DateTime.now().startOf('day')
  const diff = Math.round(parsed.startOf('day').diff(today, 'days').days)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return parsed.toLocaleString({ weekday: 'short', month: 'short', day: 'numeric' })
}

export function shortDate(ts: number, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: timezone }).format(ts)
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = now - ts
  const minutes = Math.round(diff / 60_000)
  if (Math.abs(minutes) < 1) return 'just now'
  if (Math.abs(minutes) < 60) return minutes > 0 ? `${minutes}m ago` : `in ${-minutes}m`
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return hours > 0 ? `${hours}h ago` : `in ${-hours}h`
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 7) return days > 0 ? `${days}d ago` : `in ${-days}d`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function dueLabel(dueAt: number | null, timezone?: string): { label: string; tone: 'danger' | 'warning' | 'muted' } {
  if (!dueAt) return { label: 'No date', tone: 'muted' }
  const now = Date.now()
  if (dueAt < now) return { label: 'Overdue', tone: 'danger' }
  const today = localDateKey(now, timezone)
  const tomorrow = DateTime.now().plus({ days: 1 }).toISODate()
  const key = localDateKey(dueAt, timezone)
  if (key === today) return { label: 'Today', tone: 'warning' }
  if (key === tomorrow) return { label: 'Tomorrow', tone: 'muted' }
  return { label: shortDate(dueAt, timezone), tone: 'muted' }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** UTC millis for a wall-clock date + time in the user's zone. */
export function combine(date: string, time: string, timezone: string): number {
  return DateTime.fromISO(`${date}T${time}`, { zone: timezone }).toMillis()
}

export const toDateInput = (ts: number, timezone: string): string => DateTime.fromMillis(ts, { zone: timezone }).toFormat('yyyy-MM-dd')

export const toTimeInput = (ts: number, timezone: string): string => DateTime.fromMillis(ts, { zone: timezone }).toFormat('HH:mm')

export const todayKey = (timezone: string): string => DateTime.now().setZone(timezone).toFormat('yyyy-MM-dd')

export const nowTimeInput = (timezone: string): string => DateTime.now().setZone(timezone).toFormat('HH:mm')

export const browserTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export function humanTimezone(timezone: string): string {
  return timezone.replace(/_/g, ' ')
}

/** "in 3 days" / "2 days ago" for deadlines. */
export function untilLabel(ts: number): string {
  const days = Math.ceil((ts - Date.now()) / 86_400_000)
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0
}
