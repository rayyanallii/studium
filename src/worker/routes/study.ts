import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import type { AppContext } from '../env'
import { aiKey } from '../env'
import { exec, id, many, one } from '../db'
import { fail, isResponse, parseBody, reply } from '../lib/http'
import { answerNotebook, extractImage, generateStudy, gradeQuiz } from '../lib/study-ai'
import { subjectExists, subjectSource } from '../lib/subjects'
import { STUDY_LIMITS, type StudyArtifact, type StudyMaterial, type NotebookMessage, type QuizAttempt } from '../../shared/study'

export const study = new Hono<AppContext>()
study.use('*', bodyLimit({ maxSize: STUDY_LIMITS.fileBytes + 500000, onError: c => fail(c, 413, 'too_large', 'Files must be 10 MB or smaller.') }))
type MaterialRow = { id: string; title: string; file_name: string | null; mime: string; bytes: number; object_key: string | null; extracted_text: string; subject_id: string | null; created_at: number }
type ArtifactRow = { id: string; title: string; kind: StudyArtifact['kind']; source_ids: string; subject_id: string | null; content: string; created_at: number }
const material = (row: MaterialRow): StudyMaterial => ({ id: row.id, title: row.title, fileName: row.file_name, mime: row.mime, bytes: row.bytes, text: row.extracted_text, subjectId: row.subject_id ?? null, createdAt: row.created_at })
const artifact = (row: ArtifactRow): StudyArtifact => ({ id: row.id, title: row.title, kind: row.kind, sourceIds: JSON.parse(row.source_ids), subjectId: row.subject_id ?? null, content: JSON.parse(row.content), createdAt: row.created_at, learned: [] })
const errorMessage = (error: unknown) => error instanceof Error && !(error instanceof SyntaxError) ? error.message : 'The AI returned an unreadable response. Please try again.'

async function reserveAI(db: D1Database, owner: string, limit: number) {
  const usageId = id()
  const result = await exec(db, `INSERT INTO ai_generation_usage (id, owner_sub, generation_type, status, request_id, created_at)
    SELECT ?, ?, 'study', 'requested', ?, ? WHERE (SELECT COUNT(*) FROM ai_generation_usage WHERE owner_sub = ? AND generation_type = 'study' AND created_at > ?) < ?`,
    usageId, owner, usageId, Date.now(), owner, Date.now() - 86400000, limit)
  return result.meta.changes > 0 ? usageId : null
}
const dailyLimit = (value?: string) => Math.max(1, Math.min(100, Number(value) || 30))
async function sourcesFor(db: D1Database, owner: string, ids: string[]) {
  const rows = await many<MaterialRow>(db, `SELECT * FROM study_materials WHERE owner_sub = ? AND id IN (${ids.map(() => '?').join(',')})`, owner, ...ids)
  if (rows.length !== ids.length) return null
  return rows.map(material)
}

study.get('/materials', async c => {
  const subjectId = c.req.query('subjectId')
  const rows = subjectId
    ? await many<MaterialRow>(c.get('db'), 'SELECT * FROM study_materials WHERE owner_sub = ? AND subject_id = ? ORDER BY created_at DESC LIMIT 100', c.get('user').sub, subjectId)
    : await many<MaterialRow>(c.get('db'), 'SELECT * FROM study_materials WHERE owner_sub = ? ORDER BY created_at DESC LIMIT 100', c.get('user').sub)
  return reply(c, { items: rows.map(material) })
})

study.post('/materials', async c => {
  const owner = c.get('user').sub, db = c.get('db')
  const count = await one<{ n: number }>(db, 'SELECT COUNT(*) AS n FROM study_materials WHERE owner_sub = ?', owner)
  if ((count?.n ?? 0) >= 100) return fail(c, 422, 'library_full', 'Your library has reached 100 sources. Remove unused sources first.')
  let form: FormData
  try { form = await c.req.raw.formData() } catch { return fail(c, 400, 'invalid_upload', 'Choose a file or paste your notes.') }
  const title = String(form.get('title') ?? '').trim().slice(0, 160)
  const subjectId = String(form.get('subjectId') ?? '').trim() || null
  let text = String(form.get('text') ?? '').trim()
  const file = form.get('file')
  let mime = 'text/plain', bytes = 0, fileName: string | null = null, objectKey: string | null = null, buffer: ArrayBuffer | null = null
  const sourceId = id()
  if (!title) return fail(c, 422, 'title_required', 'Give this source a title.')
  if (subjectId) {
    const source = await subjectSource(c.env, c.get('accessToken'), c.get('user'))
    if (!(await subjectExists(source, db, owner, subjectId))) return fail(c, 422, 'unknown_subject', 'That subject does not exist in your workspace.')
  }
  if (file instanceof File) {
    if (!c.env.FILES) return fail(c, 503, 'storage_missing', 'File storage is not connected. You can still paste notes.')
    if (file.size === 0 || file.size > STUDY_LIMITS.fileBytes) return fail(c, 413, 'file_size', 'Upload a non-empty file of 10 MB or less.')
    fileName = file.name.slice(0, 200); bytes = file.size; buffer = await file.arrayBuffer()
    const head = new Uint8Array(buffer.slice(0, 12)), signature = new TextDecoder().decode(head)
    if (/\.pdf$/i.test(file.name) && signature.startsWith('%PDF-')) mime = 'application/pdf'
    else if (/\.docx$/i.test(file.name) && head[0] === 0x50 && head[1] === 0x4b) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else if (/\.png$/i.test(file.name) && head[0] === 137 && signature.slice(1, 4) === 'PNG') mime = 'image/png'
    else if (/\.jpe?g$/i.test(file.name) && head[0] === 255 && head[1] === 216 && head[2] === 255) mime = 'image/jpeg'
    else if (/\.webp$/i.test(file.name) && signature.startsWith('RIFF') && signature.slice(8, 12) === 'WEBP') mime = 'image/webp'
    else return fail(c, 415, 'file_type', 'Supported files: PDF, DOCX, PNG, JPEG and WebP. The contents must match the file type.')
    if (mime.startsWith('image/')) {
      if (!aiKey(c.env)) return fail(c, 503, 'ai_unavailable', 'AI is needed to read images. Configure the server AI key or paste the image text.')
      const usageId = await reserveAI(db, owner, dailyLimit(c.env.STUDY_AI_DAILY_LIMIT))
      if (!usageId) return fail(c, 429, 'ai_limit', 'Your study AI limit has been reached. Try again tomorrow.')
      try { text = (await extractImage(c.env, buffer, mime)).trim(); await exec(db, 'UPDATE ai_generation_usage SET status = ? WHERE id = ?', 'completed', usageId) }
      catch (error) { await exec(db, 'UPDATE ai_generation_usage SET status = ? WHERE id = ?', 'failed', usageId); return fail(c, 502, 'image_read_failed', errorMessage(error)) }
      if (text === 'NO_READABLE_TEXT') return fail(c, 422, 'unreadable_image', 'No readable study text was found. Try a clearer photo or paste notes.')
    }
    objectKey = `study/${owner}/${sourceId}`
  }
  if (text.length < 40) return fail(c, 422, 'no_text', 'Add at least 40 characters of readable study text. For scanned PDFs, upload page images instead.')
  if (text.length > STUDY_LIMITS.textCharacters) return fail(c, 422, 'text_too_long', 'This source is too long. Split it into sections under 80,000 characters.')
  if (buffer && objectKey) await c.env.FILES!.put(objectKey, buffer, { httpMetadata: { contentType: mime } })
  try {
    await exec(db, 'INSERT INTO study_materials (id, owner_sub, title, file_name, mime, bytes, object_key, extracted_text, subject_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', sourceId, owner, title, fileName, mime, bytes, objectKey, text, subjectId, Date.now())
  } catch (error) { if (objectKey) await c.env.FILES!.delete(objectKey); throw error }
  return reply(c, { id: sourceId }, 201)
})

study.get('/materials/:id/file', async c => {
  const row = await one<MaterialRow>(c.get('db'), 'SELECT * FROM study_materials WHERE id = ? AND owner_sub = ?', c.req.param('id'), c.get('user').sub)
  if (!row?.object_key || !c.env.FILES) return fail(c, 404, 'not_found', 'Source file not found.')
  const object = await c.env.FILES.get(row.object_key)
  if (!object) return fail(c, 404, 'not_found', 'Source file not found.')
  c.header('Content-Type', row.mime); c.header('X-Content-Type-Options', 'nosniff'); c.header('Cache-Control', 'private, no-store')
  c.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name || 'source')}`)
  return c.body(object.body)
})

study.post('/ocr-page', async c => {
  if (!aiKey(c.env)) return fail(c, 503, 'ai_unavailable', 'AI is needed to read scanned pages. Configure the server AI key or upload a PDF with selectable text.')
  const form = await c.req.raw.formData()
  const file = form.get('file')
  if (!(file instanceof File) || file.size > 2 * 1024 * 1024 || file.size < 8) return fail(c, 422, 'invalid_page', 'Choose a page image under 2 MB.')
  const buffer = await file.arrayBuffer(), bytes = new Uint8Array(buffer)
  if (bytes[0] !== 137 || new TextDecoder().decode(bytes.slice(1, 4)) !== 'PNG') return fail(c, 422, 'invalid_page', 'Page images must be PNG.')
  const usageId = await reserveAI(c.get('db'), c.get('user').sub, dailyLimit(c.env.STUDY_AI_DAILY_LIMIT))
  if (!usageId) return fail(c, 429, 'ai_limit', 'Your study AI limit has been reached. Try again tomorrow.')
  try {
    const text = await extractImage(c.env, buffer, 'image/png')
    await exec(c.get('db'), 'UPDATE ai_generation_usage SET status = ? WHERE id = ?', 'completed', usageId)
    return reply(c, { text: text === 'NO_READABLE_TEXT' ? '' : text })
  } catch (error) { await exec(c.get('db'), 'UPDATE ai_generation_usage SET status = ? WHERE id = ?', 'failed', usageId); return fail(c, 502, 'ocr_failed', errorMessage(error)) }
})

const figureSchema = z.object({ sourceId: z.string().uuid(), page: z.number().int().min(1).max(50), rect: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1), z.number().positive().max(1), z.number().positive().max(1)]).refine(([x,y,w,h]) => x+w <= 1.001 && y+h <= 1.001), caption: z.string().max(400) })
study.patch('/artifacts/:id/figures', async c => {
  const input = await parseBody(c, z.object({ topic: z.number().int().min(0).max(19), figures: z.array(figureSchema).max(8), previous: z.array(figureSchema).max(8) }))
  if (isResponse(input)) return input
  const db = c.get('db'), owner = c.get('user').sub
  const row = await one<ArtifactRow>(db, "SELECT * FROM study_artifacts WHERE id = ? AND owner_sub = ? AND kind = 'notebook'", c.req.param('id'), owner)
  if (!row || !artifact(row).content.sections?.[input.topic]) return fail(c, 404, 'not_found', 'Notebook topic not found.')
  const sources = await sourcesFor(db, owner, artifact(row).sourceIds)
  if (input.figures.some(figure => !sources?.some(source => source.id === figure.sourceId && source.mime === 'application/pdf'))) return fail(c, 422, 'invalid_source', 'Use a PDF belonging to this notebook.')
  const path = `$.sections[${input.topic}].figures`
  const result = await exec(db, 'UPDATE study_artifacts SET content = json_set(content, ?, json(?)) WHERE id = ? AND owner_sub = ? AND COALESCE(json_extract(content, ?), json(\'[]\')) = json(?)', path, JSON.stringify(input.figures), row.id, owner, path, JSON.stringify(input.previous))
  if (!result.meta.changes) return fail(c, 409, 'figures_changed', 'These diagrams changed in another tab. Refresh before trying again.')
  return reply(c, { saved: true })
})

study.delete('/materials/:id', async c => {
  const db = c.get('db'), owner = c.get('user').sub, sourceId = c.req.param('id')
  const row = await one<MaterialRow>(db, 'SELECT * FROM study_materials WHERE id = ? AND owner_sub = ?', sourceId, owner)
  if (!row) return fail(c, 404, 'not_found', 'Source not found.')
  const removed = await exec(db, 'DELETE FROM study_materials WHERE id = ? AND owner_sub = ? AND NOT EXISTS (SELECT 1 FROM study_artifacts WHERE owner_sub = ? AND EXISTS (SELECT 1 FROM json_each(source_ids) WHERE value = ?))', sourceId, owner, owner, sourceId)
  if (!removed.meta.changes) return fail(c, 409, 'source_in_use', 'This source is cited by a study set. Delete the linked decks, quizzes or notebooks first to preserve their citations.')
  if (row.object_key && c.env.FILES) await c.env.FILES.delete(row.object_key)
  return reply(c, { deleted: true })
})

study.get('/artifacts', async c => {
  const subjectId = c.req.query('subjectId')
  const rows = subjectId
    ? await many<ArtifactRow>(c.get('db'), 'SELECT * FROM study_artifacts WHERE owner_sub = ? AND subject_id = ? ORDER BY created_at DESC LIMIT 100', c.get('user').sub, subjectId)
    : await many<ArtifactRow>(c.get('db'), 'SELECT * FROM study_artifacts WHERE owner_sub = ? ORDER BY created_at DESC LIMIT 100', c.get('user').sub)
  return reply(c, { items: rows.map(artifact) })
})

study.post('/generate', async c => {
  const input = await parseBody(c, z.object({ kind: z.enum(['flashcards', 'quiz', 'notebook']), sourceIds: z.array(z.string().uuid()).min(1).max(STUDY_LIMITS.sourcesPerGeneration).refine(ids => new Set(ids).size === ids.length) }))
  if (isResponse(input)) return input
  if (!aiKey(c.env)) return fail(c, 503, 'ai_unavailable', 'AI is not configured on the server. Your uploaded sources are saved; try generation once it is connected.')
  const db = c.get('db'), owner = c.get('user').sub
  const sources = await sourcesFor(db, owner, input.sourceIds)
  if (!sources) return fail(c, 404, 'source_missing', 'One or more sources could not be found in your library.')
  if (sources.reduce((sum, source) => sum + source.text.length, 0) > STUDY_LIMITS.totalSourceCharacters) return fail(c, 422, 'too_much_text', 'Select fewer sources; a study set can use up to 100,000 characters.')
  const usageId = await reserveAI(db, owner, dailyLimit(c.env.STUDY_AI_DAILY_LIMIT))
  if (!usageId) return fail(c, 429, 'ai_limit', 'Your study AI limit has been reached. Try again tomorrow.')
  try {
    const { title, ...content } = await generateStudy(c.env, input.kind, sources)
    const subjectId = sources.find(source => source.subjectId)?.subjectId ?? null
    const artifactId = id()
    const results = await db.batch([
      db.prepare(`INSERT INTO study_artifacts (id, owner_sub, title, kind, source_ids, subject_id, content, created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM study_materials WHERE owner_sub = ? AND id IN (${input.sourceIds.map(() => '?').join(',')})) = ?`).bind(artifactId, owner, title, input.kind, JSON.stringify(input.sourceIds), subjectId, JSON.stringify(content), Date.now(), owner, ...input.sourceIds, input.sourceIds.length),
      db.prepare('UPDATE ai_generation_usage SET status = ? WHERE id = ?').bind('completed', usageId),
    ])
    if (!results[0].meta.changes) return fail(c, 409, 'source_changed', 'A selected source was removed during generation. Select your sources again.')
    return reply(c, { id: artifactId }, 201)
  } catch (error) { await exec(db, 'UPDATE ai_generation_usage SET status = ? WHERE id = ?', 'failed', usageId); return fail(c, 502, 'generation_failed', errorMessage(error)) }
})

study.get('/artifacts/:id', async c => {
  const db = c.get('db'), owner = c.get('user').sub, artifactId = c.req.param('id')
  const row = await one<ArtifactRow>(db, 'SELECT * FROM study_artifacts WHERE id = ? AND owner_sub = ?', artifactId, owner)
  if (!row) return fail(c, 404, 'not_found', 'Study set not found.')
  const item = artifact(row)
  const [sources, reviews, messages, attempts] = await Promise.all([
    sourcesFor(db, owner, item.sourceIds),
    many<{ card_index: number }>(db, 'SELECT card_index FROM flashcard_reviews WHERE owner_sub = ? AND artifact_id = ? AND learned = 1', owner, artifactId),
    many<{ id: string; question: string; answer: string; citations: string; created_at: number }>(db, 'SELECT * FROM notebook_messages WHERE owner_sub = ? AND artifact_id = ? ORDER BY created_at LIMIT 100', owner, artifactId),
    many<{ id: string; score: number; total: number; answers: string; created_at: number }>(db, 'SELECT * FROM quiz_attempts WHERE owner_sub = ? AND artifact_id = ? ORDER BY created_at DESC LIMIT 10', owner, artifactId),
  ])
  return reply(c, { ...item, learned: reviews.map(review => review.card_index), sources: sources ?? [], messages: messages.map(message => ({ id: message.id, question: message.question, answer: message.answer, citations: JSON.parse(message.citations), createdAt: message.created_at } satisfies NotebookMessage)), attempts: attempts.map(attempt => ({ id: attempt.id, score: attempt.score, total: attempt.total, answers: JSON.parse(attempt.answers), createdAt: attempt.created_at } satisfies QuizAttempt)) })
})

study.post('/artifacts/:id/review', async c => {
  const input = await parseBody(c, z.object({ cardIndex: z.number().int().min(0), learned: z.boolean() }))
  if (isResponse(input)) return input
  const db = c.get('db'), owner = c.get('user').sub, artifactId = c.req.param('id')
  const row = await one<ArtifactRow>(db, 'SELECT * FROM study_artifacts WHERE id = ? AND owner_sub = ? AND kind = ?', artifactId, owner, 'flashcards')
  if (!row || input.cardIndex >= (artifact(row).content.cards?.length ?? 0)) return fail(c, 404, 'not_found', 'Flashcard not found.')
  await exec(db, 'INSERT INTO flashcard_reviews (artifact_id, owner_sub, card_index, learned, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(artifact_id, owner_sub, card_index) DO UPDATE SET learned = excluded.learned, updated_at = excluded.updated_at', artifactId, owner, input.cardIndex, Number(input.learned), Date.now())
  return reply(c, { saved: true })
})

study.post('/artifacts/:id/attempt', async c => {
  const input = await parseBody(c, z.object({ answers: z.array(z.number().int().min(0).max(3)).min(3).max(15) }))
  if (isResponse(input)) return input
  const db = c.get('db'), owner = c.get('user').sub, artifactId = c.req.param('id')
  const row = await one<ArtifactRow>(db, 'SELECT * FROM study_artifacts WHERE id = ? AND owner_sub = ? AND kind = ?', artifactId, owner, 'quiz')
  if (!row) return fail(c, 404, 'not_found', 'Quiz not found.')
  const questions = artifact(row).content.questions!
  if (questions.length !== input.answers.length) return fail(c, 422, 'incomplete_quiz', 'Answer every question before submitting.')
  const score = gradeQuiz(questions.map(question => question.correctIndex), input.answers)
  const attempt: QuizAttempt = { id: id(), score, total: questions.length, answers: input.answers, createdAt: Date.now() }
  await exec(db, 'INSERT INTO quiz_attempts (id, artifact_id, owner_sub, answers, score, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', attempt.id, artifactId, owner, JSON.stringify(input.answers), score, questions.length, attempt.createdAt)
  return reply(c, attempt, 201)
})

study.post('/artifacts/:id/ask', async c => {
  const input = await parseBody(c, z.object({ question: z.string().trim().min(3).max(1500) }))
  if (isResponse(input)) return input
  if (!aiKey(c.env)) return fail(c, 503, 'ai_unavailable', 'AI is not configured on the server.')
  const db = c.get('db'), owner = c.get('user').sub, artifactId = c.req.param('id')
  const row = await one<ArtifactRow>(db, 'SELECT * FROM study_artifacts WHERE id = ? AND owner_sub = ? AND kind = ?', artifactId, owner, 'notebook')
  if (!row) return fail(c, 404, 'not_found', 'Notebook not found.')
  const sources = await sourcesFor(db, owner, artifact(row).sourceIds)
  if (!sources) return fail(c, 409, 'source_missing', 'A notebook source is no longer available.')
  const history = await many<{ question: string; answer: string }>(db, 'SELECT question, answer FROM notebook_messages WHERE owner_sub = ? AND artifact_id = ? ORDER BY created_at DESC LIMIT 4', owner, artifactId)
  const count = await one<{ n: number }>(db, 'SELECT COUNT(*) AS n FROM notebook_messages WHERE owner_sub = ? AND artifact_id = ?', owner, artifactId)
  if ((count?.n ?? 0) >= 100) return fail(c, 422, 'notebook_full', 'This notebook has 100 questions. Create a fresh notebook to continue.')
  const usageId = await reserveAI(db, owner, dailyLimit(c.env.STUDY_AI_DAILY_LIMIT))
  if (!usageId) return fail(c, 429, 'ai_limit', 'Your study AI limit has been reached. Try again tomorrow.')
  try {
    const result = await answerNotebook(c.env, sources, input.question, history.reverse())
    const message: NotebookMessage = { id: id(), question: input.question, answer: result.answer, citations: result.citations, createdAt: Date.now() }
    await db.batch([
      db.prepare('INSERT INTO notebook_messages (id, artifact_id, owner_sub, question, answer, citations, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(message.id, artifactId, owner, message.question, message.answer, JSON.stringify(message.citations), message.createdAt),
      db.prepare('UPDATE ai_generation_usage SET status = ? WHERE id = ?').bind('completed', usageId),
    ])
    return reply(c, message, 201)
  } catch (error) { await exec(db, 'UPDATE ai_generation_usage SET status = ? WHERE id = ?', 'failed', usageId); return fail(c, 502, 'answer_failed', errorMessage(error)) }
})

study.delete('/artifacts/:id', async c => {
  const db = c.get('db'), owner = c.get('user').sub, artifactId = c.req.param('id')
  await db.batch(['flashcard_reviews', 'notebook_messages', 'quiz_attempts', 'notebook_notes'].map(table => db.prepare(`DELETE FROM ${table} WHERE artifact_id = ? AND owner_sub = ?`).bind(artifactId, owner)).concat(db.prepare('DELETE FROM study_artifacts WHERE id = ? AND owner_sub = ?').bind(artifactId, owner)))
  return reply(c, { deleted: true })
})
