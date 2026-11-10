import type { MiddlewareHandler } from 'hono'

import type { AppContext } from './env'

// Schema lives with the Worker: D1 has no migration tool on Freebuff Sites, so
// tables are created on the first request of each isolate. Statements are
// idempotent; append new ones at the end when the model grows.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS notebook_notes (
    id TEXT PRIMARY KEY, artifact_id TEXT NOT NULL, owner_sub TEXT NOT NULL,
    title TEXT NOT NULL, body TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS notebook_notes_owner ON notebook_notes(owner_sub, artifact_id, updated_at)`,
  `CREATE TABLE IF NOT EXISTS assistant_messages (
    id TEXT PRIMARY KEY, owner_sub TEXT NOT NULL, role TEXT NOT NULL,
    content TEXT NOT NULL, created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS assistant_messages_owner ON assistant_messages(owner_sub, created_at)`,
  `CREATE TABLE IF NOT EXISTS assistant_actions (
    id TEXT PRIMARY KEY, message_id TEXT NOT NULL, owner_sub TEXT NOT NULL,
    proposal TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    error TEXT, result TEXT, created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS assistant_actions_owner ON assistant_actions(owner_sub, message_id)`,
  `CREATE TABLE IF NOT EXISTS users (
    owner_sub TEXT PRIMARY KEY,
    seeded_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    owner_sub TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    academic_context TEXT,
    learning_goal TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    onboarding_step INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS study_preferences (
    owner_sub TEXT PRIMARY KEY,
    preferred_session_minutes INTEGER NOT NULL DEFAULT 50,
    break_minutes INTEGER NOT NULL DEFAULT 10,
    max_daily_minutes INTEGER NOT NULL DEFAULT 240,
    planning_horizon_days INTEGER NOT NULL DEFAULT 7,
    planning_style TEXT NOT NULL DEFAULT 'balanced',
    theme TEXT NOT NULL DEFAULT 'dark',
    urgent_first INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#635BFF',
    priority TEXT NOT NULL DEFAULT 'medium',
    difficulty INTEGER NOT NULL DEFAULT 3,
    weekly_target_minutes INTEGER,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS subjects_owner ON subjects(owner_sub, created_at)`,
  `CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    estimated_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'not_started',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS topics_owner ON topics(owner_sub, subject_id)`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    topic_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'todo',
    due_at INTEGER,
    estimated_minutes INTEGER NOT NULL,
    completed_minutes INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS tasks_owner ON tasks(owner_sub, status, due_at)`,
  `CREATE INDEX IF NOT EXISTS tasks_subject ON tasks(owner_sub, subject_id)`,
  `CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_at INTEGER NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS assessments_owner ON assessments(owner_sub, due_at)`,
  `CREATE TABLE IF NOT EXISTS availability_rules (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    weekday INTEGER NOT NULL,
    start_local_time TEXT NOT NULL,
    end_local_time TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS availability_owner ON availability_rules(owner_sub, weekday)`,
  `CREATE TABLE IF NOT EXISTS availability_overrides (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    local_date TEXT NOT NULL,
    start_local_time TEXT,
    end_local_time TEXT,
    is_unavailable INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS overrides_owner ON availability_overrides(owner_sub, local_date)`,
  `CREATE TABLE IF NOT EXISTS study_plans (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'proposed',
    generation_source TEXT NOT NULL DEFAULT 'heuristic',
    explanation TEXT,
    summary TEXT,
    payload TEXT NOT NULL,
    warnings TEXT,
    totals TEXT,
    request_id TEXT,
    created_at INTEGER NOT NULL,
    accepted_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS plans_owner ON study_plans(owner_sub, status, created_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS plans_request ON study_plans(owner_sub, request_id)`,
  `CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    plan_id TEXT,
    subject_id TEXT NOT NULL,
    task_id TEXT,
    title TEXT NOT NULL,
    starts_at INTEGER NOT NULL,
    ends_at INTEGER NOT NULL,
    planned_minutes INTEGER NOT NULL,
    actual_minutes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planned',
    is_locked INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_owner ON study_sessions(owner_sub, starts_at)`,
  `CREATE INDEX IF NOT EXISTS sessions_plan ON study_sessions(owner_sub, plan_id)`,
  `CREATE INDEX IF NOT EXISTS sessions_task ON study_sessions(owner_sub, task_id)`,
  `CREATE TABLE IF NOT EXISTS focus_runs (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    study_session_id TEXT,
    subject_id TEXT,
    task_id TEXT,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    planned_seconds INTEGER NOT NULL,
    accumulated_focus_seconds INTEGER NOT NULL DEFAULT 0,
    last_resumed_at INTEGER,
    status TEXT NOT NULL DEFAULT 'running',
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS focus_owner ON focus_runs(owner_sub, started_at DESC)`,
  `CREATE INDEX IF NOT EXISTS focus_session ON focus_runs(owner_sub, study_session_id)`,
  `CREATE TABLE IF NOT EXISTS ai_generation_usage (
    id TEXT PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    generation_type TEXT NOT NULL,
    status TEXT NOT NULL,
    request_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS usage_request ON ai_generation_usage(owner_sub, request_id)`,
  `CREATE INDEX IF NOT EXISTS usage_owner ON ai_generation_usage(owner_sub, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS study_materials (
    id TEXT PRIMARY KEY, owner_sub TEXT NOT NULL, title TEXT NOT NULL,
    file_name TEXT, mime TEXT NOT NULL, bytes INTEGER NOT NULL DEFAULT 0,
    object_key TEXT, extracted_text TEXT NOT NULL, subject_id TEXT, created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS materials_owner ON study_materials(owner_sub, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS study_artifacts (
    id TEXT PRIMARY KEY, owner_sub TEXT NOT NULL, title TEXT NOT NULL,
    kind TEXT NOT NULL, source_ids TEXT NOT NULL, subject_id TEXT, content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS artifacts_owner ON study_artifacts(owner_sub, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS flashcard_reviews (
    artifact_id TEXT NOT NULL, owner_sub TEXT NOT NULL, card_index INTEGER NOT NULL,
    learned INTEGER NOT NULL, updated_at INTEGER NOT NULL,
    PRIMARY KEY (artifact_id, owner_sub, card_index)
  )`,
  `CREATE TABLE IF NOT EXISTS notebook_messages (
    id TEXT PRIMARY KEY, artifact_id TEXT NOT NULL, owner_sub TEXT NOT NULL,
    question TEXT NOT NULL, answer TEXT NOT NULL, citations TEXT NOT NULL, created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS messages_artifact ON notebook_messages(owner_sub, artifact_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY, artifact_id TEXT NOT NULL, owner_sub TEXT NOT NULL,
    answers TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS attempts_artifact ON quiz_attempts(owner_sub, artifact_id, created_at)`,
]

// Columns added after a table first shipped. Each runs once and is ignored when
// the column already exists, so old databases catch up on their next request.
const MIGRATIONS = [
  'ALTER TABLE study_materials ADD COLUMN subject_id TEXT',
  'ALTER TABLE study_artifacts ADD COLUMN subject_id TEXT',
]

let ready: Promise<void> | undefined

export function ensureSchema(db: D1Database): Promise<void> {
  ready ??= db.batch(SCHEMA.map((sql) => db.prepare(sql))).then(
    async () => {
      for (const sql of MIGRATIONS) {
        try { await db.prepare(sql).run() } catch { /* column already present */ }
      }
    },
    (error) => {
      ready = undefined
      throw error
    },
  )
  return ready
}

export const requireDb: MiddlewareHandler<AppContext> = async (c, next) => {
  const db = c.env.DB
  if (!db) {
    return c.json({ success: false, error: { code: 'database_missing', message: 'No database is attached yet. Add D1 storage named DB and redeploy.' } }, 503)
  }
  await ensureSchema(db)
  c.set('db', db)
  await next()
}

export const id = () => crypto.randomUUID()
export const now = () => Date.now()

type Row = Record<string, unknown>

export async function one<T = Row>(db: D1Database, sql: string, ...params: unknown[]): Promise<T | null> {
  return (await db.prepare(sql).bind(...params).first<T>()) ?? null
}

export async function many<T = Row>(db: D1Database, sql: string, ...params: unknown[]): Promise<T[]> {
  const result = await db.prepare(sql).bind(...params).all<T>()
  return result.results ?? []
}

export async function exec(db: D1Database, sql: string, ...params: unknown[]): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run()
}

export const num = (value: unknown, fallback = 0) => (value === null || value === undefined ? fallback : Number(value))
export const text = (value: unknown): string | null => (value === null || value === undefined ? null : String(value))
export const bool = (value: unknown) => Number(value) === 1

/** A stable, non-cryptographic key for a proposed session. */
export function sessionKey(...parts: string[]): string {
  return parts.join(':')
}
