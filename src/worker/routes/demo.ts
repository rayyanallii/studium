import { Hono } from 'hono'

import type { AppContext } from '../env'
import { fail, reply } from '../lib/http'
import { ensureProfile } from '../lib/rows'
import { subjectRecords, subjectSource } from '../lib/subjects'
import { toWorkspaceError } from '../lib/pg'
import { clearWorkspace, seedDemo } from '../seed'

export const demo = new Hono<AppContext>()

demo.post('/account/demo', async (c) => {
  const user = c.get('user')
  const db = c.get('db')
  const { profile, prefs } = await ensureProfile(db, user)
  const replace = c.req.query('replace') === '1'

  try {
    const source = await subjectSource(c.env, c.get('accessToken'), user)
    const existing = await subjectRecords(source, db, user.sub)
    if (existing.length > 0 && !replace) {
      return fail(c, 409, 'workspace_not_empty', 'Your workspace already has subjects. Replace it to load the sample data.')
    }

    const target = { pg: source.pg, workspaceId: source.workspaceId, profileId: user.sub }
    if (replace) await clearWorkspace(db, user.sub, target)

    const result = await seedDemo(db, user.sub, profile.timezone, prefs, target)
    return reply(c, { seeded: result, replaced: replace })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create the sample workspace.'
    if (error && typeof error === 'object' && 'workspaceError' in error) throw toWorkspaceError(error as never)
    return fail(c, 503, 'workspace_unavailable', message)
  }
})
