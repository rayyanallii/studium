// Postgres access for the workspace API.
//
// The client is created per request with the *user's* access token, so every
// query runs under row-level security. There is no service-role key in the
// Worker: ownership is enforced by the database policies, not by our WHERE
// clauses alone. Handlers still scope queries explicitly as defence in depth.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { FreebuffUser } from '@freebuff/auth'

import type { Env } from '../env'

export class WorkspaceDbError extends Error {
  constructor(
    message: string,
    public code: 'schema_missing' | 'database_error' = 'database_error',
  ) {
    super(message)
  }
}

const MISSING_TABLE = 'PGRST205'

export function workspaceClient(env: Env, token: string | undefined): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY || !token) return null
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export function toWorkspaceError(error: { code?: string; message?: string } | null): WorkspaceDbError {
  if (error?.code === MISSING_TABLE) {
    return new WorkspaceDbError(
      'The Supabase schema has not been applied to this project yet. Run the SQL in supabase/migrations.',
      'schema_missing',
    )
  }
  return new WorkspaceDbError(error?.message ?? 'The workspace database rejected that request.')
}

/** The one default personal workspace for this user, provisioned on first use. */
export async function ensureWorkspace(pg: SupabaseClient, user: FreebuffUser): Promise<string> {
  const existing = await pg.from('workspaces').select('id').eq('owner_user_id', user.sub).eq('is_default', true).maybeSingle()
  if (existing.error) throw toWorkspaceError(existing.error)
  if (existing.data) return existing.data.id

  const displayName = (user.name?.trim() || user.email?.split('@')[0] || 'Student').slice(0, 60)

  // The sign-up trigger normally creates these rows; this keeps accounts that
  // predate the migration working and makes provisioning idempotent.
  const profile = await pg.from('profiles').upsert({ id: user.sub, display_name: displayName }, { onConflict: 'id', ignoreDuplicates: true })
  if (profile.error) throw toWorkspaceError(profile.error)

  const created = await pg.from('workspaces').insert({ owner_user_id: user.sub, name: 'Personal workspace', is_default: true }).select('id').single()
  if (created.error) {
    // A concurrent request may have won the race; re-read before giving up.
    const raced = await pg.from('workspaces').select('id').eq('owner_user_id', user.sub).eq('is_default', true).maybeSingle()
    if (raced.data) return raced.data.id
    throw toWorkspaceError(created.error)
  }

  const preferences = await pg.from('study_preferences').upsert({ workspace_id: created.data.id }, { onConflict: 'workspace_id', ignoreDuplicates: true })
  if (preferences.error) throw toWorkspaceError(preferences.error)

  return created.data.id
}

/** Workspace lookup that must not create anything (e.g. account deletion). */
export async function findWorkspace(pg: SupabaseClient, user: FreebuffUser): Promise<string | null> {
  const result = await pg.from('workspaces').select('id').eq('owner_user_id', user.sub).eq('is_default', true).maybeSingle()
  if (result.error) throw toWorkspaceError(result.error)
  return result.data?.id ?? null
}
