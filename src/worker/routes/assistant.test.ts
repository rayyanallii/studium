import { Hono } from 'hono'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppContext, Env } from '../env'
import { ensureSchema } from '../db'
import { assistant } from './assistant'
import { allowedTool } from '../lib/assistant-tools'

describe('assistant workspace actions', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('limits tools to workspace routes', () => {
    expect(allowedTool('GET', '/tasks?filter=overdue')).toBe(true)
    expect(allowedTool('PATCH', '/tasks/task-1')).toBe(true)
    for (const path of ['/account', '/auth/status', '//example.com/tasks', '/tasks/../account', '/tasks/%2faccount', '/assistant/messages']) {
      expect(allowedTool('GET', path)).toBe(false)
      expect(allowedTool('DELETE', path)).toBe(false)
    }
  })

  it('reads real task data, persists a proposal, and applies it once for its owner', async () => {
    const sqliteModule = 'node:sqlite'
    const { DatabaseSync } = await import(sqliteModule)
    const sqlite = new DatabaseSync(':memory:')
    function prepare(sql: string, params: unknown[] = []): D1PreparedStatement {
      const statement = () => sqlite.prepare(sql)
      const values = params as Parameters<ReturnType<typeof statement>['run']>
      return {
        bind: (...args: unknown[]) => prepare(sql, args),
        first: async () => statement().get(...values) ?? null,
        all: async () => ({ results: statement().all(...values) }),
        run: async () => ({ meta: { changes: Number(statement().run(...values).changes) } }),
      } as unknown as D1PreparedStatement
    }
    const db = { prepare, batch: (statements: D1PreparedStatement[]) => Promise.all(statements.map(statement => statement.run())) } as unknown as D1Database
    try {
      await ensureSchema(db)
      sqlite.exec(`INSERT INTO subjects (id,owner_sub,name,created_at,updated_at) VALUES ('subject-1','owner','Chemistry',1,1);
        INSERT INTO tasks (id,owner_sub,subject_id,title,estimated_minutes,created_at,updated_at) VALUES ('task-1','owner','subject-1','Review notes',30,1,1);`)
      const answer = (content: object) => Response.json({ choices: [{ message: { content: JSON.stringify(content) } }] })
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(answer({ reads: ['/tasks'] }))
        .mockImplementationOnce(async (_url, init) => {
          expect(init.body).toContain('Review notes')
          return answer({ message: 'I can rename your task.', actions: [{ title: 'Rename task', description: 'Rename Review notes to Review chapter 2.', method: 'PATCH', path: '/tasks/task-1', body: { title: 'Review chapter 2' } }] })
        }))
      const app = new Hono<AppContext>()
      app.use('*', async (c, next) => {
        c.set('user', { sub: c.req.header('x-test-owner') ?? 'owner', name: 'Student' } as AppContext['Variables']['user'])
        c.set('db', db)
        await next()
      })
      app.route('/assistant', assistant)
      const env = { EXPLABS_API_KEY: 'fixture' } as Env
      const send = await app.request('/assistant/messages', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'Rename Review notes to Review chapter 2' }) }, env)
      expect(send.status, await send.clone().text()).toBe(200)
      const { data } = await send.json() as { data: { message: { actions: { id: string }[] } } }
      const title = () => sqlite.prepare("SELECT title FROM tasks WHERE id = 'task-1'").get()?.title
      expect(title()).toBe('Review notes')
      const path = `/assistant/actions/${data.message.actions[0].id}/apply`
      expect((await app.request(path, { method: 'POST', headers: { 'x-test-owner': 'other' } }, env)).status).toBe(404)
      expect((await app.request(path, { method: 'POST' }, env)).status).toBe(200)
      expect(title()).toBe('Review chapter 2')
      expect((await app.request(path, { method: 'POST' }, env)).status).toBe(409)
    } finally {
      sqlite.close()
    }
  })
})
