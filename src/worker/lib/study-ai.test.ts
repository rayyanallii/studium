import { describe, expect, it, vi } from 'vitest'
import { generateStudy } from './study-ai'
import type { Env } from '../env'
import type { StudyMaterial } from '../../shared/study'
import { flashcardOptionsSchema } from '../../shared/flashcard-options'
import { answerSchema, generatedSchemas, gradeQuiz, verifyCitations } from './study-ai'

describe('source-grounded generation', () => {
  const sources = [{ id: 'own-source', text: 'The Calvin cycle occurs in the stroma.\nIt uses ATP and NADPH.' }]
  it('accepts quotations with PDF whitespace differences', () => {
    expect(verifyCitations([{ sourceId: 'own-source', quote: 'stroma. It uses ATP and NADPH.' }], sources)).toBe(true)
  })
  it('rejects invented quotes and citations outside the selected sources', () => {
    expect(verifyCitations([{ sourceId: 'other-user-source', quote: 'The Calvin cycle occurs in the stroma.' }], sources)).toBe(false)
    expect(verifyCitations([{ sourceId: 'own-source', quote: 'The Calvin cycle occurs in mitochondria.' }], sources)).toBe(false)
    expect(verifyCitations([{ sourceId: 'own-source', quote: '' }], sources)).toBe(false)
  })
  it('does not accept a confident notebook answer without evidence', () => {
    expect(answerSchema.safeParse({ answer: 'A confident answer.', insufficientEvidence: false, citations: [] }).success).toBe(false)
    expect(answerSchema.safeParse({ answer: 'The sources do not contain that information.', insufficientEvidence: true, citations: [] }).success).toBe(true)
  })
  it('rejects incomplete AI quiz structures', () => {
    expect(generatedSchemas.quiz.safeParse({ title: 'Test', questions: [] }).success).toBe(false)
    expect(generatedSchemas.quiz.safeParse({ title: 'Test', questions: Array(3).fill({ question: 'Where?', options: ['A', 'B'], correctIndex: 4, explanation: '...', sourceId: 'own-source', quote: 'The Calvin cycle' }) }).success).toBe(false)
  })
})

describe('quiz scoring', () => {
  it('scores from the stored answer key and accepts zero as an answer', () => {
    expect(gradeQuiz([0, 2, 3], [0, 1, 3])).toBe(2)
    expect(gradeQuiz([0, 2, 3], [1, 1, 1])).toBe(0)
  })
  it('rejects missing, extra, and invalid answers', () => {
    expect(() => gradeQuiz([0, 2, 3], [0, 2])).toThrow()
    expect(() => gradeQuiz([0, 2, 3], [0, 2, 3, 0])).toThrow()
    expect(() => gradeQuiz([0, 2, 3], [0, -1, 3])).toThrow()
    expect(() => gradeQuiz([0, 2, 3], [0, 1.5, 3])).toThrow()
  })
})

it('honours flashcard count and topic, and rejects mismatched output', async () => {
  let sent = ''
  const source = { id: 'source', text: 'Reduction is the gain of electrons.', title: 'Chemistry' } as StudyMaterial
  const response = { title: 'Reduction', cards: Array.from({ length: 5 }, (_, i) => ({ front: `Question ${i}`, back: 'Answer', sourceId: 'source', quote: source.text })) }
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => { sent = init.body; return Response.json({ choices: [{ message: { content: JSON.stringify(response) }, finish_reason: 'stop' }] }) }))
  try {
    await generateStudy({ EXPLABS_API_KEY: 'test' } as Env, 'flashcards', [source], { count: 5, topic: 'Reduction' })
    expect(sent).toContain('exactly 5')
    expect(sent).toContain('Reduction')
    await expect(generateStudy({ EXPLABS_API_KEY: 'test' } as Env, 'flashcards', [source], { count: 10 })).rejects.toThrow('requested 10')
    expect(flashcardOptionsSchema.safeParse({ count: 21 }).success).toBe(false)
    expect(flashcardOptionsSchema.safeParse({ count: 5, topic: '   ' }).success).toBe(false)
  } finally { vi.unstubAllGlobals() }
})
