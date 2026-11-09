import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'

const origin = 'http://127.0.0.1:5173'
const notes = `Photosynthesis converts light energy into chemical energy stored in glucose. Plants absorb light using chlorophyll in chloroplasts. Carbon dioxide and water are inputs; glucose and oxygen are products.
The light-dependent reactions occur in the thylakoid membranes of chloroplasts. They use light energy to split water and produce ATP, NADPH and oxygen. Oxygen is released as a by-product of water splitting.
The Calvin cycle occurs in the stroma of the chloroplast. It uses ATP and NADPH from the light-dependent reactions to fix carbon dioxide into sugar. The Calvin cycle does not use light directly, but depends on the products of the light-dependent reactions.
Stomata are pores in leaves that allow carbon dioxide to enter and oxygen to exit. Guard cells regulate the opening and closing of stomata. Closing stomata reduces water loss but also limits carbon dioxide uptake.
The rate of photosynthesis can be limited by light intensity, carbon dioxide concentration or temperature. Increasing one factor only increases the rate until a different factor becomes limiting. Very high temperatures can damage enzymes involved in photosynthesis.
Cellular respiration releases energy from glucose to produce ATP. Aerobic respiration uses glucose and oxygen and produces carbon dioxide and water. Photosynthesis stores energy in glucose, while respiration releases that energy for cellular work.`

async function request(path, { method = 'GET', json, body, expected = 200 } = {}) {
  const response = await fetch(`${origin}/api/study${path}`, { method, headers: { Origin: origin, ...(json ? { 'Content-Type': 'application/json' } : {}) }, body: json ? JSON.stringify(json) : body })
  const result = await response.json()
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(result)}`)
  return result.data
}

if (process.argv.includes('--cleanup')) {
  const saved = JSON.parse(await readFile('output/study-check/live-results.json', 'utf8'))
  for (const id of saved.artifacts) await request(`/artifacts/${id}`, { method: 'DELETE' })
  await request(`/materials/${saved.source}`, { method: 'DELETE' })
  for (const item of (await request('/materials')).items.filter(item => /^Verification upload (notes|pdf|docx|png)$/.test(item.title))) await request(`/materials/${item.id}`, { method: 'DELETE' })
  console.log('Removed only the study verification fixtures.')
  process.exit(0)
}
const created = []
let source
try {
  const form = new FormData(); form.set('title', 'Verification: photosynthesis'); form.set('text', notes)
  source = (await request('/materials', { method: 'POST', body: form, expected: 201 })).id
  assert((await request('/materials')).items.some(item => item.id === source && item.text.replace(/\r\n/g, '\n') === notes))
  console.log('PASS: source creation and persistence')
  await request('/generate', { method: 'POST', json: { kind: 'quiz', sourceIds: [crypto.randomUUID()] }, expected: 404 })
  const invalid = new FormData(); invalid.set('title', 'Bad file'); invalid.set('file', new File(['not a PDF'], 'bad.pdf', { type: 'application/pdf' })); invalid.set('text', notes)
  await request('/materials', { method: 'POST', body: invalid, expected: 415 })
  console.log('PASS: unknown sources and mismatched file types rejected')
  const data = {}
  for (const kind of ['flashcards', 'quiz', 'notebook']) {
    const result = await request('/generate', { method: 'POST', json: { kind, sourceIds: [source] }, expected: 201 })
    created.push(result.id)
    const detail = await request(`/artifacts/${result.id}`)
    assert.equal(detail.kind, kind)
    const content = detail.content.cards ?? detail.content.questions ?? detail.content.sections
    assert(content.length > 0)
    for (const item of content) { assert.equal(item.sourceId, source); assert(notes.replace(/\s+/g, ' ').toLowerCase().includes(item.quote.replace(/\s+/g, ' ').toLowerCase())) }
    data[kind] = detail
    console.log(`PASS: live ${kind} generation, persisted content and valid source quotations`)
  }
  await request(`/artifacts/${data.flashcards.id}/review`, { method: 'POST', json: { cardIndex: 0, learned: true } })
  assert((await request(`/artifacts/${data.flashcards.id}`)).learned.includes(0))
  await request(`/artifacts/${data.flashcards.id}/review`, { method: 'POST', json: { cardIndex: 999, learned: true }, expected: 404 })
  const correct = data.quiz.content.questions.map(question => question.correctIndex)
  const result = await request(`/artifacts/${data.quiz.id}/attempt`, { method: 'POST', json: { answers: correct }, expected: 201 })
  assert.equal(result.score, correct.length)
  assert.equal((await request(`/artifacts/${data.quiz.id}`)).attempts[0].score, correct.length)
  const message = await request(`/artifacts/${data.notebook.id}/ask`, { method: 'POST', json: { question: 'How do the light-dependent reactions support the Calvin cycle?' }, expected: 201 })
  assert(message.citations.length > 0)
  assert((await request(`/artifacts/${data.notebook.id}`)).messages.some(item => item.id === message.id))
  await request(`/materials/${source}`, { method: 'DELETE', expected: 409 })
  console.log('PASS: card reviews, quiz grading, notebook Q&A, persistence and source deletion guard')
  await mkdir('output/study-check', { recursive: true })
  await writeFile('output/study-check/live-results.json', JSON.stringify({ source, artifacts: created, data, message }, null, 2))
  console.log('Saved fixture IDs for browser verification; cleanup with --cleanup after browser checks.')
} catch (error) {
  for (const id of created) await request(`/artifacts/${id}`, { method: 'DELETE' }).catch(() => {})
  if (source) await request(`/materials/${source}`, { method: 'DELETE' }).catch(() => {})
  throw error
}
