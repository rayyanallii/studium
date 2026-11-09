import { Hono } from 'hono'
import { z } from 'zod'

import { id, many, one } from '../db'
import type { AppContext } from '../env'
import { isValidDate, isValidTime, minutesOfDay } from '../lib/dates'
import { fail, isResponse, parseBody, reply } from '../lib/http'

export const availability = new Hono<AppContext>()

const ruleSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  startLocalTime: z.string().refine(isValidTime, 'Use a 24-hour time like 17:30.'),
  endLocalTime: z.string().refine(isValidTime, 'Use a 24-hour time like 19:00.'),
})

const rulesSchema = z.object({ rules: z.array(ruleSchema).max(40) })

const overrideSchema = z.object({
  localDate: z.string().refine(isValidDate, 'Use a valid date.'),
  startLocalTime: z.string().refine(isValidTime, 'Use a 24-hour time.').nullish(),
  endLocalTime: z.string().refine(isValidTime, 'Use a 24-hour time.').nullish(),
  isUnavailable: z.boolean().default(false),
})

const overridesSchema = z.object({ overrides: z.array(overrideSchema).max(120) })

availability.get('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const [rules, overrides] = await Promise.all([
    many<{ id: string; weekday: number; start_local_time: string; end_local_time: string }>(
      db,
      'SELECT id, weekday, start_local_time, end_local_time FROM availability_rules WHERE owner_sub = ? ORDER BY weekday, start_local_time',
      user.sub,
    ),
    many<{ id: string; local_date: string; start_local_time: string | null; end_local_time: string | null; is_unavailable: number }>(
      db,
      'SELECT id, local_date, start_local_time, end_local_time, is_unavailable FROM availability_overrides WHERE owner_sub = ? ORDER BY local_date',
      user.sub,
    ),
  ])
  return reply(c, {
    rules: rules.map((row) => ({ id: row.id, weekday: Number(row.weekday), startLocalTime: row.start_local_time, endLocalTime: row.end_local_time })),
    overrides: overrides.map((row) => ({
      id: row.id,
      localDate: row.local_date,
      startLocalTime: row.start_local_time,
      endLocalTime: row.end_local_time,
      isUnavailable: Number(row.is_unavailable) === 1,
    })),
  })
})

availability.put('/', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, rulesSchema)
  if (isResponse(parsed)) return parsed

  // Reject invalid or overlapping windows before anything is written.
  for (const rule of parsed.rules) {
    const start = minutesOfDay(rule.startLocalTime)
    const end = minutesOfDay(rule.endLocalTime)
    if (end <= start) {
      return fail(c, 422, 'invalid_window', `A window on weekday ${rule.weekday} ends before it starts.`)
    }
  }
  for (let weekday = 1; weekday <= 7; weekday++) {
    const windows = parsed.rules
      .filter((rule) => rule.weekday === weekday)
      .map((rule) => ({ start: minutesOfDay(rule.startLocalTime), end: minutesOfDay(rule.endLocalTime) }))
      .sort((a, b) => a.start - b.start)
    for (let i = 1; i < windows.length; i++) {
      if (windows[i].start < windows[i - 1].end) {
        return fail(c, 422, 'overlapping_windows', 'Two availability windows on the same day overlap.')
      }
    }
  }

  const now = Date.now()
  const statements = [db.prepare('DELETE FROM availability_rules WHERE owner_sub = ?').bind(user.sub)]
  for (const rule of parsed.rules) {
    statements.push(
      db
        .prepare('INSERT INTO availability_rules (id, owner_sub, weekday, start_local_time, end_local_time, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id(), user.sub, rule.weekday, rule.startLocalTime, rule.endLocalTime, now),
    )
  }
  await db.batch(statements)
  return reply(c, { saved: parsed.rules.length })
})

availability.put('/overrides', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const parsed = await parseBody(c, overridesSchema)
  if (isResponse(parsed)) return parsed

  for (const override of parsed.overrides) {
    const timed = Boolean(override.startLocalTime && override.endLocalTime)
    if (!override.isUnavailable && !timed) {
      return fail(c, 422, 'invalid_override', 'A date override needs either a blocked day or a time window.')
    }
    if (timed && minutesOfDay(override.endLocalTime!) <= minutesOfDay(override.startLocalTime!)) {
      return fail(c, 422, 'invalid_override', 'An override window ends before it starts.')
    }
  }

  const now = Date.now()
  const statements = [db.prepare('DELETE FROM availability_overrides WHERE owner_sub = ?').bind(user.sub)]
  for (const override of parsed.overrides) {
    statements.push(
      db
        .prepare(
          'INSERT INTO availability_overrides (id, owner_sub, local_date, start_local_time, end_local_time, is_unavailable, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          id(),
          user.sub,
          override.localDate,
          override.isUnavailable ? null : (override.startLocalTime ?? null),
          override.isUnavailable ? null : (override.endLocalTime ?? null),
          override.isUnavailable ? 1 : 0,
          now,
        ),
    )
  }
  await db.batch(statements)
  return reply(c, { saved: parsed.overrides.length })
})

availability.delete('/overrides/:id', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const existing = await one<{ id: string }>(db, 'SELECT id FROM availability_overrides WHERE id = ? AND owner_sub = ?', c.req.param('id'), user.sub)
  if (!existing) return fail(c, 404, 'not_found', 'That override no longer exists.')
  await db.prepare('DELETE FROM availability_overrides WHERE id = ? AND owner_sub = ?').bind(c.req.param('id'), user.sub).run()
  return reply(c, { deleted: true })
})
