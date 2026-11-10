import { Hono } from 'hono'
import { z } from 'zod'
import { bodyLimit } from 'hono/body-limit'
import type { AppContext } from '../env'
import { exec, id, many, one } from '../db'
import { fail, isResponse, parseBody, reply } from '../lib/http'

export const notebookNotes = new Hono<AppContext>()
notebookNotes.use('*', bodyLimit({ maxSize: 100000, onError: c => fail(c, 413, 'too_large', 'This note is too long.') }))
notebookNotes.use('/:artifactId/*', async (c, next) => {
  const notebook = await one(c.get('db'), "SELECT id FROM study_artifacts WHERE id = ? AND owner_sub = ? AND kind = 'notebook'", c.req.param('artifactId'), c.get('user').sub)
  if (!notebook) return fail(c, 404, 'not_found', 'Notebook not found.')
  await next()
})

const noteSchema = z.object({ title: z.string().trim().min(1).max(160), body: z.string().max(30000) })

notebookNotes.get('/:artifactId/notes', async c => {
  const items = await many(c.get('db'), 'SELECT id,title,body,version,created_at AS createdAt,updated_at AS updatedAt FROM notebook_notes WHERE artifact_id = ? AND owner_sub = ? ORDER BY updated_at DESC', c.req.param('artifactId'), c.get('user').sub)
  return reply(c, { items })
})

notebookNotes.post('/:artifactId/notes', async c => {
  const parsed = await parseBody(c, noteSchema)
  if (isResponse(parsed)) return parsed
  const noteId = id(), now = Date.now()
  const result = await exec(c.get('db'), `INSERT INTO notebook_notes (id,artifact_id,owner_sub,title,body,created_at,updated_at)
    SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM study_artifacts WHERE id = ? AND owner_sub = ? AND kind = 'notebook')`, noteId, c.req.param('artifactId'), c.get('user').sub, parsed.title, parsed.body, now, now, c.req.param('artifactId'), c.get('user').sub)
  if (!result.meta.changes) return fail(c, 404, 'not_found', 'Notebook not found.')
  return reply(c, { id: noteId, ...parsed, version: 1, createdAt: now, updatedAt: now }, 201)
})

notebookNotes.patch('/:artifactId/notes/:id', async c => {
  const parsed = await parseBody(c, noteSchema.extend({ version: z.number().int().positive() }))
  if (isResponse(parsed)) return parsed
  const result = await exec(c.get('db'), 'UPDATE notebook_notes SET title = ?,body = ?,version = version + 1,updated_at = ? WHERE id = ? AND artifact_id = ? AND owner_sub = ? AND version = ?', parsed.title, parsed.body, Date.now(), c.req.param('id'), c.req.param('artifactId'), c.get('user').sub, parsed.version)
  if (!result.meta.changes) return fail(c, 409, 'note_changed', 'This note changed in another tab. Reopen the saved note before editing it again. Your draft is still here.')
  return reply(c, { saved: true })
})

notebookNotes.delete('/:artifactId/notes/:id', async c => {
  await exec(c.get('db'), 'DELETE FROM notebook_notes WHERE id = ? AND artifact_id = ? AND owner_sub = ?', c.req.param('id'), c.req.param('artifactId'), c.get('user').sub)
  return reply(c, { deleted: true })
})
