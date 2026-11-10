import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '../env'
import { exec, one } from '../db'
import { focus } from './focus'

vi.mock('../db', () => ({ exec: vi.fn(), one: vi.fn(), num: Number, id: () => 'run' }))
vi.mock('../lib/subjects', () => ({
  subjectSource: vi.fn(), subjectExists: vi.fn(),
  subjectDirectory: vi.fn(async () => ({ subjects: new Map() })),
}))
vi.mock('../lib/rows', () => ({ ensureProfile: vi.fn(), loadSession: vi.fn(async () => ({ id: 'planned' })) }))

describe('focus cancellation', () => {
  const app = new Hono<AppContext>()
  app.use('*', async (c, next) => {
    c.set('user', { sub: 'owner' } as never)
    c.set('db', {} as D1Database)
    await next()
  })
  app.route('/focus', focus)
  beforeEach(() => vi.clearAllMocks())

  it.each(['running', 'paused'])('discards all time from a %s run without updating planned work', async status => {
    vi.mocked(one).mockResolvedValue({
      id: 'run', study_session_id: 'planned', task_id: 'task', subject_id: null,
      started_at: Date.now() - 600_000, planned_seconds: 1500,
      accumulated_focus_seconds: 300, last_resumed_at: Date.now() - 120_000,
      ended_at: null, status,
    })
    const response = await app.request('/focus/run/cancel', { method: 'POST' })
    expect(response.status).toBe(200)
    const result = await response.json() as { data: { recordedMinutes: number } }
    expect(result.data.recordedMinutes).toBe(0)
    expect(exec).toHaveBeenCalledExactlyOnceWith({}, expect.stringContaining('UPDATE focus_runs'), 0, expect.any(Number), 'abandoned', 'run', 'owner')
    expect(vi.mocked(one).mock.calls[0]).toEqual([{}, expect.stringContaining('owner_sub = ?'), 'run', 'owner'])
  })

  it('does not rewrite an already completed run on a repeated cancellation', async () => {
    vi.mocked(one).mockResolvedValue({ id: 'run', status: 'completed' })
    expect((await app.request('/focus/run/cancel', { method: 'POST' })).status).toBe(200)
    expect(exec).not.toHaveBeenCalled()
  })

  it('rejects a missing or another owner’s run', async () => {
    vi.mocked(one).mockResolvedValue(null)
    expect((await app.request('/focus/run/cancel', { method: 'POST' })).status).toBe(404)
    expect(exec).not.toHaveBeenCalled()
  })
})
