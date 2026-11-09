// Live account smoke test for the Postgres slice.
//
//   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... SUPABASE_SECRET_KEY=... \
//   APP_ORIGIN=http://localhost:5173 node scripts/qa-account.mjs
//
// Creates two confirmed accounts, exercises /api/me, preferences and account
// deletion, proves row-level isolation, then removes both auth users. The secret
// key is used only for test setup and cleanup, never by the application.

const URL_BASE = process.env.SUPABASE_URL
const PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE_KEY
const SECRET = process.env.SUPABASE_SECRET_KEY
const APP = process.env.APP_ORIGIN ?? 'http://localhost:5173'
const stamp = Date.now()
const password = `Qa-${Math.random().toString(36).slice(2)}-9x!`

const adminHeaders = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, 'content-type': 'application/json' }
let failures = 0
const check = (label, ok, detail = '') => {
  if (ok) console.log(`  PASS  ${label}`)
  else {
    failures += 1
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

async function makeUser(name) {
  const email = `qa+${stamp}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@example.com`
  const created = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: name } }),
  }).then((r) => r.json())
  const token = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: PUBLISHABLE, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json())
  if (!created.id || !token.access_token) throw new Error(`user setup failed: ${JSON.stringify({ created, token })}`)
  return { id: created.id, email, token: token.access_token }
}

const call = async (path, token, init = {}) => {
  const response = await fetch(`${APP}/api${path}`, {
    ...init,
    headers: { accept: 'application/json', Authorization: `Bearer ${token}`, ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.method && init.method !== 'GET' ? { Origin: APP } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  return { status: response.status, body: await response.json().catch(() => null) }
}

const pg = async (path) => fetch(`${URL_BASE}/rest/v1/${path}`, { headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` } }).then((r) => r.json())

const a = await makeUser('Ada QA')
const b = await makeUser('Grace QA')

const me1 = await call('/me', a.token)
check('GET /me provisions a workspace', me1.status === 200, JSON.stringify(me1.body))
check('profile carries the sign-up display name', me1.body?.data?.profile.displayName === 'Ada QA', JSON.stringify(me1.body?.data?.profile))
check('auth mode is supabase', me1.body?.data?.capabilities.auth === 'supabase')

const workspaceA = await pg(`workspaces?select=id&owner_user_id=eq.${a.id}`)
check('Postgres holds exactly one workspace for the user', Array.isArray(workspaceA) && workspaceA.length === 1, JSON.stringify(workspaceA))
const prefsA = await pg(`study_preferences?select=theme,preferred_session_minutes&workspace_id=eq.${workspaceA[0]?.id}`)
check('Postgres holds study preferences', prefsA?.[0]?.theme === 'dark', JSON.stringify(prefsA))

const updated = await call('/me', a.token, { method: 'PATCH', body: { displayName: 'Ada Renamed', onboardingCompleted: true } })
check('PATCH /me updates the profile', updated.status === 200 && updated.body?.data?.profile.displayName === 'Ada Renamed', JSON.stringify(updated.body))
check('onboarding flag persists', updated.body?.data?.profile.onboardingCompleted === true)

const preferences = await call('/me/preferences', a.token, { method: 'PATCH', body: { theme: 'light', preferredSessionMinutes: 45 } })
check('PATCH /me/preferences updates preferences', preferences.status === 200 && preferences.body?.data?.preferences.theme === 'light', JSON.stringify(preferences.body))
const storedPrefs = await pg(`study_preferences?select=theme,preferred_session_minutes&workspace_id=eq.${workspaceA[0]?.id}`)
check('preference change is stored in Postgres', storedPrefs?.[0]?.theme === 'light' && storedPrefs?.[0]?.preferred_session_minutes === 45, JSON.stringify(storedPrefs))

const meB = await call('/me', b.token)
check('second user gets their own profile', meB.body?.data?.profile.displayName === 'Grace QA', JSON.stringify(meB.body?.data?.profile))
const workspaceBRow = await pg(`workspaces?select=id&owner_user_id=eq.${b.id}`)
check('second user gets a different workspace', workspaceBRow?.[0]?.id && workspaceBRow[0].id !== workspaceA[0]?.id)

const rlsProbe = await fetch(`${URL_BASE}/rest/v1/profiles?select=id`, { headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${a.token}` } }).then((r) => r.json())
check('RLS lets a user read only their own profile', Array.isArray(rlsProbe) && rlsProbe.length === 1 && rlsProbe[0].id === a.id, JSON.stringify(rlsProbe))

const deleted = await call('/account?confirm=delete', a.token, { method: 'DELETE' })
check('DELETE /account succeeds', deleted.status === 200, JSON.stringify(deleted.body))
const afterDelete = await pg(`workspaces?select=id&owner_user_id=eq.${a.id}`)
check('deleting the account removes the workspace rows', Array.isArray(afterDelete) && afterDelete.length === 0, JSON.stringify(afterDelete))
const profileAfter = await pg(`profiles?select=id&id=eq.${a.id}`)
check('deleting the account removes the profile', Array.isArray(profileAfter) && profileAfter.length === 0, JSON.stringify(profileAfter))
const untouchedB = await pg(`workspaces?select=id&owner_user_id=eq.${b.id}`)
check("the other user's workspace is untouched", Array.isArray(untouchedB) && untouchedB.length === 1)

for (const user of [a, b]) {
  await fetch(`${URL_BASE}/auth/v1/admin/users/${user.id}`, { method: 'DELETE', headers: adminHeaders })
}
console.log(failures === 0 ? '\nLive account checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
