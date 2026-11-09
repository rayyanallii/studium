// AI recommendation layer.
//
// The model is asked only to rank work, suggest durations and explain itself.
// It never chooses timeline positions: the scheduler owns every timestamp. If
// the provider is unavailable or returns malformed output the planner falls
// back to the heuristic ranking and says so.

import { z } from 'zod'

import type { Env } from '../env'
import { AI_DEFAULTS, aiKey, aiModel } from '../env'
import type { AiHint, SchedulerInput } from './scheduler'

const RecommendationSchema = z.object({
  summary: z.string().max(600).catch(''),
  task_recommendations: z
    .array(
      z.object({
        task_id: z.string(),
        priority: z.coerce.number().min(0).max(100).catch(50),
        estimated_minutes: z.coerce.number().min(5).max(300).nullish(),
        reasoning: z.string().max(240).nullish(),
      }),
    )
    .max(60)
    .catch([]),
  subject_allocations: z
    .array(z.object({ subject_id: z.string(), percentage: z.coerce.number().min(0).max(100) }))
    .max(30)
    .catch([]),
  warnings: z.array(z.string().max(240)).max(10).catch([]),
  suggestions: z.array(z.string().max(240)).max(10).catch([]),
})

export interface AiRecommendation {
  summary: string
  hints: AiHint[]
  allocations: { subjectId: string; percentage: number }[]
  warnings: string[]
  suggestions: string[]
  usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  model: string
}

const SYSTEM_PROMPT = `You are the study-planning intelligence behind Studium.

Your role is to help a student distribute study effort realistically using only the data supplied: subjects, tasks, deadlines, difficulty, availability and preferences.

Prioritise achievable schedules, balanced workloads and urgent academic commitments.

Rules:
- Use only the ids supplied in the payload. Never invent tasks, subjects, deadlines or history.
- Do not return calendar times. A separate scheduling engine assigns time slots.
- If the workload exceeds the available time, state the shortfall explicitly in warnings.
- Keep every explanation concise and specific.

Return ONLY a JSON object with this exact shape:
{
  "summary": "one or two sentences",
  "task_recommendations": [
    { "task_id": "supplied task id", "priority": 0-100, "estimated_minutes": 30, "reasoning": "short reason" }
  ],
  "subject_allocations": [ { "subject_id": "supplied subject id", "percentage": 0-100 } ],
  "warnings": ["..."],
  "suggestions": ["..."]
}`

interface AiRequest {
  subjects: { id: string; name: string; priority: string; difficulty: number; weeklyTargetMinutes: number | null; studiedMinutesThisWeek: number }[]
  tasks: { id: string; subjectId: string; title: string; priority: string; dueAt: number | null; remainingMinutes: number }[]
  assessments: { subjectId: string; title: string; dueAt: number }[]
  capacityByDate: { date: string; minutes: number }[]
  preferences: { preferredSessionMinutes: number; maxDailyMinutes: number; planningStyle: string; urgentFirst: boolean }
  now: number
}

export function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object in model response')
  return JSON.parse(trimmed.slice(start, end + 1))
}

export async function generateRecommendations(env: Env, input: AiRequest): Promise<AiRecommendation | null> {
  const key = aiKey(env)
  if (!key) return null
  const baseUrl = (env.AI_BASE_URL || AI_DEFAULTS.baseUrl).replace(/\/$/, '')
  const model = aiModel(env)

  const payload = {
    today: new Date(input.now).toISOString().slice(0, 10),
    now_ms: input.now,
    subjects: input.subjects,
    tasks: input.tasks,
    assessments: input.assessments,
    capacity_by_date: input.capacityByDate,
    preferences: input.preferences,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_DEFAULTS.timeoutMs)

  type Message = { role: 'system' | 'user' | 'assistant'; content: string }
  type Body = {
    choices?: { message?: { content?: string } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    model?: string
  }

  const ask = async (extra: Message[] = []): Promise<Response> => {
    const messages: Message[] = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: JSON.stringify(payload) }, ...extra]
    const send = (jsonMode: boolean) =>
      fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          temperature: jsonMode ? 0.2 : 0.1,
          max_tokens: 2000,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          messages,
        }),
      })
    const response = await send(true)
    // Some gateways reject response_format; retry once without it.
    return response.status === 400 || response.status === 422 ? send(false) : response
  }

  const read = async (response: Response) => {
    if (!response.ok) {
      console.error('AI gateway error', response.status, (await response.text()).slice(0, 300))
      return { body: null, parsed: null }
    }
    const body = (await response.json()) as Body
    const content = body.choices?.[0]?.message?.content
    let parsed: ReturnType<typeof RecommendationSchema.safeParse> | null = null
    try {
      parsed = content ? RecommendationSchema.safeParse(parseJsonObject(content)) : null
    } catch (error) {
      parsed = null
      console.error('AI response was not JSON', error instanceof Error ? error.message : error, content?.slice(0, 240))
    }
    if (!content) console.error('AI response had no content')
    return { body, parsed, content }
  }

  try {
    let { body, parsed, content } = (await read(await ask())) as { body: Body | null; parsed: ReturnType<typeof RecommendationSchema.safeParse> | null; content?: string }

    // A single repair turn: some models occasionally emit a broken array when
    // they run long. Feed the bad reply back rather than dropping to heuristics.
    if (body && (!parsed || !parsed.success)) {
      console.error('AI response failed validation', parsed && !parsed.success ? parsed.error.message.slice(0, 240) : 'empty')
      const repair: Message[] = content
        ? [
            { role: 'assistant', content },
            { role: 'user', content: 'That reply was not valid JSON for the required shape. Reply again with the corrected JSON object only, and keep it compact.' },
          ]
        : [{ role: 'user', content: 'Reply with the JSON object only.' }]
      ;({ body, parsed, content } = (await read(await ask(repair))) as { body: Body | null; parsed: ReturnType<typeof RecommendationSchema.safeParse> | null; content?: string })
    }

    if (!body || !parsed || !parsed.success) return null
    const data = parsed.data

    const knownTasks = new Set(input.tasks.map((t) => t.id))
    const knownSubjects = new Set(input.subjects.map((s) => s.id))
    const hints: AiHint[] = data.task_recommendations
      .filter((r) => knownTasks.has(r.task_id))
      .map((r) => ({
        taskId: r.task_id,
        priority: r.priority,
        estimatedMinutes: r.estimated_minutes ? Math.round(r.estimated_minutes) : null,
      }))

    return {
      summary: data.summary,
      hints,
      allocations: data.subject_allocations.filter((a) => knownSubjects.has(a.subject_id)).map((a) => ({ subjectId: a.subject_id, percentage: a.percentage })),
      warnings: data.warnings,
      suggestions: data.suggestions,
      usage: {
        promptTokens: body.usage?.prompt_tokens ?? 0,
        completionTokens: body.usage?.completion_tokens ?? 0,
        totalTokens: body.usage?.total_tokens ?? 0,
      },
      model: body.model || model,
    }
  } catch (error) {
    console.error('AI request failed', error instanceof Error ? error.message : error)
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Compact, validated view of the planning inputs that is safe to send. */
export function aiInputFrom(input: SchedulerInput, capacityByDate: { date: string; minutes: number }[], assessments: AiRequest['assessments']): AiRequest {
  return {
    subjects: input.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      priority: s.priority,
      difficulty: s.difficulty,
      weeklyTargetMinutes: s.weeklyTargetMinutes,
      studiedMinutesThisWeek: s.studiedWeekMinutes,
    })),
    tasks: input.tasks.map((t) => ({
      id: t.id,
      subjectId: t.subjectId,
      title: t.title.slice(0, 140),
      priority: t.priority,
      dueAt: t.dueAt,
      remainingMinutes: Math.max(0, t.estimatedMinutes - t.completedMinutes),
    })),
    assessments,
    capacityByDate,
    preferences: {
      preferredSessionMinutes: input.preferences.preferredSessionMinutes,
      maxDailyMinutes: input.preferences.maxDailyMinutes,
      planningStyle: input.preferences.planningStyle,
      urgentFirst: input.preferences.urgentFirst,
    },
    now: input.now,
  }
}
