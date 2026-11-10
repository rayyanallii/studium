import { Hono } from 'hono'
import { expect, it } from 'vitest'
import type { AppContext } from '../env'
import { notebookNotes } from './notebook-notes'

it('persists notebook notes, rejects other owners and prevents stale overwrites', async () => {
  const moduleName = 'node:sqlite'
  const { DatabaseSync } = await import(moduleName)
  const database = new DatabaseSync(':memory:')
  database.exec(`CREATE TABLE study_artifacts (id TEXT, owner_sub TEXT, kind TEXT);
    INSERT INTO study_artifacts VALUES ('book','owner','notebook');
    CREATE TABLE notebook_notes (id TEXT PRIMARY KEY,artifact_id TEXT,owner_sub TEXT,title TEXT,body TEXT,version INTEGER DEFAULT 1,created_at INTEGER,updated_at INTEGER);`)
  const prepare = (sql: string, values: unknown[] = []): D1PreparedStatement => ({
    bind: (...args: unknown[]) => prepare(sql, args),
    first: async () => database.prepare(sql).get(...values) ?? null,
    all: async () => ({ results: database.prepare(sql).all(...values) }),
    run: async () => ({ meta: { changes: Number(database.prepare(sql).run(...values).changes) } }),
  }) as unknown as D1PreparedStatement
  const app = new Hono<AppContext>()
  app.use('*', async (context, next) => {
    context.set('user', { sub: context.req.header('x-owner') ?? 'owner' } as AppContext['Variables']['user'])
    context.set('db', { prepare } as D1Database)
    await next()
  })
  app.route('/notebooks', notebookNotes)
  const request = (path: string, method = 'GET', body?: unknown, owner = 'owner') => app.request(path, { method, headers: { 'content-type': 'application/json', 'x-owner': owner }, ...(body ? { body: JSON.stringify(body) } : {}) })
  try {
    expect((await request('/notebooks/book/notes', 'GET', undefined, 'other')).status).toBe(404)
    const created = await request('/notebooks/book/notes', 'POST', { title: 'Definition', body: 'My explanation' })
    expect(created.status).toBe(201)
    const { data } = await created.json() as { data: { id: string } }
    const path = `/notebooks/book/notes/${data.id}`
    expect((await request(path, 'PATCH', { title: 'Edited', body: 'New text', version: 1 })).status).toBe(200)
    expect((await request(path, 'PATCH', { title: 'Stale', body: 'Old tab', version: 1 })).status).toBe(409)
    expect((await request(path, 'DELETE', undefined, 'other')).status).toBe(404)
    const saved = await request('/notebooks/book/notes')
    expect(JSON.stringify(await saved.json())).toContain('New text')
    expect((await request(path, 'DELETE')).status).toBe(200)
  } finally { database.close() }
})
