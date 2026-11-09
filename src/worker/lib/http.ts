import type { Context } from 'hono'
import type { z, ZodTypeAny } from 'zod'

import type { AppContext } from '../env'

export function reply<T>(c: Context<AppContext>, data: T, status = 200) {
  c.header('Cache-Control', 'private, no-store')
  return c.json({ success: true, data } as never, status as never)
}

export function fail(c: Context<AppContext>, status: number, code: string, message: string, details?: unknown) {
  c.header('Cache-Control', 'private, no-store')
  return c.json({ success: false, error: { code, message, details } } as never, status as never)
}

/** Returns the parsed body, or a ready-made 422 response. */
export async function parseBody<S extends ZodTypeAny>(c: Context<AppContext>, schema: S): Promise<z.infer<S> | Response> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    return fail(c, 400, 'invalid_json', 'The request body must be valid JSON.')
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    return fail(c, 422, 'validation_error', issue?.message ?? 'Please check the values you entered.', result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })))
  }
  return result.data
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response
}

export const LIMITS = {
  subjectName: 80,
  subjectDescription: 400,
  topicName: 120,
  taskTitle: 160,
  taskDescription: 1000,
  assessmentTitle: 160,
  displayName: 60,
  learningGoal: 400,
  minEstimate: 10,
  maxEstimate: 600,
} as const
