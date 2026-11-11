import { expect, it } from 'vitest'
import { learningArtifactSchema } from './learning-artifact'

it('rejects broken interactive checks and excessive content', () => {
  const artifact = { title: 'Reduction', steps: [{ title: 'Before', explanation: 'Copper oxide' }, { title: 'After', explanation: 'Copper' }], check: { question: 'Which is the product?', options: ['Copper', 'Copper oxide'], correctIndex: 0, explanation: 'Copper is the product.' } }
  expect(learningArtifactSchema.safeParse(artifact).success).toBe(true)
  expect(learningArtifactSchema.safeParse({ ...artifact, check: { ...artifact.check, correctIndex: 3 } }).success).toBe(false)
  expect(learningArtifactSchema.safeParse({ ...artifact, steps: [] }).success).toBe(false)
})
