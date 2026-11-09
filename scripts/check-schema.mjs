#!/usr/bin/env node
/**
 * Applies the Supabase migrations to an in-memory Postgres (PGlite) and asserts
 * the schema, the provisioning trigger and row-level security behave as the
 * product requires. This is the migration test that runs without credentials.
 *
 *   npm run check:schema
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFileSync(join(root, path), 'utf8')

const migrations = [
  'supabase/migrations/20261110000100_init.sql',
  'supabase/migrations/20261110000200_rls.sql',
]

const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'

let failures = 0
const check = (name, condition, detail = '') => {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const db = new PGlite()
await db.waitReady

// Supabase provides these; PGlite needs a faithful local stand-in so the
// migrations and policies can run unchanged.
await db.exec(`
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid
    language sql stable
    as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
  create role authenticated nologin;
`)

for (const file of migrations) {
  await db.exec(read(file))
  console.log(`  applied ${file}`)
}

await db.exec(`
  insert into auth.users (id, email, raw_user_meta_data) values
    ('${USER_A}', 'ada@example.com', '{"display_name":"Ada Lovelace"}'::jsonb),
    ('${USER_B}', 'grace@example.com', '{}'::jsonb);
`)

const profileA = await db.query('select display_name, onboarding_completed from public.profiles where id = $1', [USER_A])
check('signup creates a profile with the supplied name', profileA.rows[0]?.display_name === 'Ada Lovelace', JSON.stringify(profileA.rows))

const profileB = await db.query('select display_name from public.profiles where id = $1', [USER_B])
check('signup falls back to the email local part for the display name', profileB.rows[0]?.display_name === 'grace', JSON.stringify(profileB.rows))

const workspaces = await db.query('select id, is_default from public.workspaces where owner_user_id = $1', [USER_A])
check('signup creates exactly one default workspace', workspaces.rows.length === 1 && workspaces.rows[0].is_default === true, JSON.stringify(workspaces.rows))
const workspaceA = workspaces.rows[0]?.id

const prefs = await db.query('select preferred_session_minutes, theme from public.study_preferences where workspace_id = $1', [workspaceA])
check('signup creates study preferences', prefs.rows.length === 1 && prefs.rows[0].theme === 'dark', JSON.stringify(prefs.rows))

await db.exec(`insert into public.subjects (workspace_id, name) values ('${workspaceA}', 'Calculus')`)

const asUser = async (userId, fn) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role;')
  }
}

const visibleA = await asUser(USER_A, () => db.query('select name from public.subjects'))
check('a user can read their own rows', visibleA.rows.length === 1, JSON.stringify(visibleA.rows))

const visibleB = await asUser(USER_B, () => db.query('select name from public.subjects'))
check("another user cannot read those rows", visibleB.rows.length === 0, JSON.stringify(visibleB.rows))

const profilesVisible = await asUser(USER_B, () => db.query('select id from public.profiles'))
check('profiles are isolated per user', profilesVisible.rows.length === 1 && profilesVisible.rows[0].id === USER_B, JSON.stringify(profilesVisible.rows))

let rejected = null
try {
  await asUser(USER_B, () => db.exec(`insert into public.subjects (workspace_id, name) values ('${workspaceA}', 'Injected')`))
} catch (error) {
  rejected = error
}
check('writing into another workspace is rejected by RLS', rejected !== null, rejected ? String(rejected.message) : 'insert succeeded')

const ownInsert = await asUser(USER_B, async () => {
  const workspaceB = (await db.query('select id from public.workspaces where owner_user_id = $1', [USER_B])).rows[0].id
  await db.exec(`insert into public.subjects (workspace_id, name) values ('${workspaceB}', 'Physics')`)
  return db.query('select name from public.subjects')
})
check('a user can write their own rows', ownInsert.rows.length === 1 && ownInsert.rows[0].name === 'Physics', JSON.stringify(ownInsert.rows))

let invalidTimeRange = null
try {
  await db.exec(`insert into public.availability_rules (workspace_id, weekday, start_local_time, end_local_time)
    values ('${workspaceA}', 1, '18:00', '17:00')`)
} catch (error) {
  invalidTimeRange = error
}
check('availability windows must end after they start', invalidTimeRange !== null)

let crossSubjectTopic = null
try {
  await db.exec(`insert into public.topics (workspace_id, subject_id, name)
    values ('${workspaceA}', gen_random_uuid(), 'Orphan')`)
} catch (error) {
  crossSubjectTopic = error
}
check('topics require an existing subject', crossSubjectTopic !== null)

console.log(failures === 0 ? '\nSchema and RLS checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
