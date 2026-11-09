import type { FreebuffUser } from '@freebuff/auth'

export interface Env {
  ASSETS: Fetcher
  // Attached by Freebuff Sites once provisioned (sites_add_storage). Optional so
  // the app can explain what is missing instead of crashing.
  DB?: D1Database
  FILES?: R2Bucket
  // Injected on deploy once Sign in with Freebuff is enabled (sites_enable_auth).
  FREEBUFF_CLIENT_ID?: string
  FREEBUFF_ISSUER?: string
  APP_ORIGIN?: string
  SUPABASE_URL?: string
  SUPABASE_PUBLISHABLE_KEY?: string
  // AI planning gateway. OpenAI-compatible; the key never reaches the browser.
  EXPLABS_API_KEY?: string
  AI_BASE_URL?: string
  AI_MODEL?: string
  AI_DAILY_LIMIT?: string
  STUDY_AI_DAILY_LIMIT?: string
}

export type Variables = {
  user: FreebuffUser
  db: D1Database
}

export type AppContext = { Bindings: Env; Variables: Variables }

export const AI_DEFAULTS = {
  baseUrl: 'https://api.experientiallabs.ai/v1',
  model: 'gpt-6-luna',
  dailyLimit: 5,
  timeoutMs: 25_000,
} as const

export function aiKey(env: Env): string | undefined {
  return env.EXPLABS_API_KEY || undefined
}

export function aiModel(env: Env): string {
  return env.AI_MODEL || AI_DEFAULTS.model
}
