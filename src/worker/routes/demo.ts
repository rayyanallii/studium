import { Hono } from 'hono'

import { num } from '../db'
import type { AppContext } from '../env'
import { fail, reply } from '../lib/http'
import { ensureProfile } from '../lib/rows'
import { clearWorkspace, seedDemo } from '../seed'
import { one } from '../db'

export const demo = new Hono<AppContext>()

demo.post('/account/demo', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile, prefs } = await ensureProfile(db, user)
  const replace = c.req.query('replace') === '1'

  const existing = await one<{ n: number }>(db, 'SELECT COUNT(*) AS n FROM subjects WHERE owner_sub = ? AND deleted_at IS NULL', user.sub)
  if (num(existing?.n) > 0 && !replace) {
    return fail(c, 409, 'workspace_not_empty', 'Your workspace already has subjects. Replace it to load the sample data.')
  }
  if (replace) await clearWorkspace(db, user.sub)

  const result = await seedDemo(db, user.sub, profile.timezone, prefs)
  return reply(c, { seeded: result, replaced: replace })
})
