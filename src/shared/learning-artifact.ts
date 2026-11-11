import { z } from 'zod'

export const learningArtifactSchema = z.object({
  title: z.string().min(1).max(160),
  steps: z.array(z.object({ title: z.string().min(1).max(160), explanation: z.string().min(1).max(1200) })).min(2).max(6),
  check: z.object({ question: z.string().min(1).max(400), options: z.array(z.string().min(1).max(200)).min(2).max(4), correctIndex: z.number().int().min(0).max(3), explanation: z.string().min(1).max(700) }).refine(value => value.correctIndex < value.options.length),
})
export const artifactPattern = /```study-artifact\s*\n([\s\S]*?)```/g

export function artifactNotes(text: string) {
  return text.replace(artifactPattern, (_block, json: string) => {
    try {
      const result = learningArtifactSchema.safeParse(JSON.parse(json))
      if (result.success) { const value = result.data; return `${value.title}\n\n${value.steps.map(step => `${step.title}\n${step.explanation}`).join('\n\n')}\n\nCheck your understanding\n${value.check.question}\n${value.check.explanation}` }
    } catch { /* Keep the readable explanation when an artifact is malformed. */ }
    return ''
  })
}
