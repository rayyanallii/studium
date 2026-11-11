import { z } from 'zod'

export const flashcardOptionsSchema = z.object({
  count: z.number().int().min(3).max(20).default(8),
  topic: z.string().trim().min(1).max(160).optional(),
})
export type FlashcardOptions = z.infer<typeof flashcardOptionsSchema>
