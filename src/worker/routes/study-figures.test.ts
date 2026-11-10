import { Hono } from 'hono'
import { expect, it } from 'vitest'
import type { AppContext } from '../env'
import { study } from './study'

it('saves source crops with owner checks, bounds validation and stale-write protection', async () => {
  const moduleName = 'node:sqlite'
  const { DatabaseSync } = await import(moduleName)
  const database = new DatabaseSync(':memory:')
  const sourceId = '11111111-1111-4111-8111-111111111111'
  database.exec('CREATE TABLE study_artifacts (id TEXT,owner_sub TEXT,kind TEXT,source_ids TEXT,content TEXT); CREATE TABLE study_materials (id TEXT,owner_sub TEXT,mime TEXT);')
  database.prepare('INSERT INTO study_artifacts VALUES (?,?,?,?,?)').run('book', 'owner', 'notebook', JSON.stringify([sourceId]), JSON.stringify({ sections: [{ heading: 'Reduction', body: 'Original explanation' }] }))
  database.prepare('INSERT INTO study_materials VALUES (?,?,?)').run(sourceId, 'owner', 'application/pdf')
  const prepare = (sql: string, values: unknown[] = []): D1PreparedStatement => ({ bind: (...args: unknown[]) => prepare(sql, args), first: async () => database.prepare(sql).get(...values) ?? null, all: async () => ({ results: database.prepare(sql).all(...values) }), run: async () => ({ meta: { changes: Number(database.prepare(sql).run(...values).changes) } }) }) as unknown as D1PreparedStatement
  const app = new Hono<AppContext>()
  app.use('*', async (c, next) => { c.set('user', { sub: c.req.header('x-owner') ?? 'owner' } as AppContext['Variables']['user']); c.set('db', { prepare } as D1Database); await next() })
  app.route('/study', study)
  const figure = { sourceId, page: 1, rect: [0, .2, .5, .5], caption: 'Reduction diagram' }
  const request = (body: unknown, owner = 'owner') => app.request('/study/artifacts/book/figures', { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-owner': owner }, body: JSON.stringify(body) })
  try {
    expect((await request({ topic: 0, figures: [figure], previous: [] }, 'other')).status).toBe(404)
    expect((await request({ topic: 0, figures: [{ ...figure, rect: [.8, 0, .5, .5] }], previous: [] })).status).toBe(422)
    expect((await request({ topic: 0, figures: [{ ...figure, sourceId: '22222222-2222-4222-8222-222222222222' }], previous: [] })).status).toBe(422)
    expect((await request({ topic: 0, figures: [figure], previous: [] })).status).toBe(200)
    expect((await request({ topic: 0, figures: [], previous: [] })).status).toBe(409)
    const saved = JSON.parse(database.prepare('SELECT content FROM study_artifacts').get().content)
    expect(saved.sections[0].body).toBe('Original explanation')
    expect(saved.sections[0].figures).toEqual([figure])
    expect((await request({ topic: 0, figures: [], previous: [figure] })).status).toBe(200)
  } finally { database.close() }
})
