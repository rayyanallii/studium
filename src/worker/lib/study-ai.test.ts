import { describe, expect, it } from 'vitest'
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
