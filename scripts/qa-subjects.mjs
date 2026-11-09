// Live subject/topic smoke test for the Postgres academic-structure slice.
//
//   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... SUPABASE_SECRET_KEY=... \
//   APP_ORIGIN=http://localhost:5173 node scripts/qa-subjects.mjs
//
// Creates a confirmed account, exercises subject and topic CRUD through the API,
// proves tasks/assessments/dashboard resolve labels from the Postgres directory,
// proves a second user cannot see the first user's subjects, then removes both
// auth users. The secret key is used only for test setup and cleanup.

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

const call = async (path, token, init = {}) => {
  const response = await fetch(`${APP}/api${path}`, {
    ...init,
    headers: { accept: 'application/json', Authorization: `Bearer ${token}`, ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.method && init.method !== 'GET' ? { Origin: APP } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  return { status: response.status, body: await response.json().catch(() => null) }
}

const pg = async (path) => fetch(`${URL_BASE}/rest/v1/${path}`, { headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` } }).then((r) => r.json())

async function makeUser(name) {
  const email = `qa-subjects+${stamp}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@example.com`
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

const a = await makeUser('Subject QA')
const b = await makeUser('Second QA')
const created = [a, b]
let workspace = null

try {
  const me = await call('/me', a.token)
  check('GET /me provisions the account', me.status === 200, JSON.stringify(me.body))
  workspace = (await pg(`workspaces?select=id&owner_user_id=eq.${a.id}`))?.[0]?.id
  check('Postgres holds the workspace', Boolean(workspace))

  const empty = await call('/subjects', a.token)
  check('subject list starts empty', empty.status === 200 && empty.body?.data?.items.length === 0, JSON.stringify(empty.body))

  const math = await call('/subjects', a.token, {
    method: 'POST',
    body: { name: 'Mathematics QA', description: 'Calculus and algebra', color: '#635BFF', priority: 'high', difficulty: 4, weeklyTargetMinutes: 300 },
  })
  const mathId = math.body?.data?.id
  check('POST /subjects creates a subject', math.status === 201 && Boolean(mathId), JSON.stringify(math.body))
  const storedSubject = await pg(`subjects?select=id,name,weekly_target_minutes,deleted_at&id=eq.${mathId}`)
  check('the subject is stored in Postgres', storedSubject?.[0]?.name === 'Mathematics QA' && storedSubject[0].weekly_target_minutes === 300, JSON.stringify(storedSubject))

  const physics = await call('/subjects', a.token, { method: 'POST', body: { name: 'Physics QA', color: '#2F77D1', priority: 'medium', difficulty: 3 } })
  check('a second subject is accepted', physics.status === 201, JSON.stringify(physics.body))

  const list = await call('/subjects', a.token)
  check('the list returns both subjects', list.body?.data?.items.length === 2, JSON.stringify(list.body?.data?.items?.length))
  check('subject stats are attached', typeof list.body?.data?.items[0]?.stats?.openTasks === 'number')

  const renamed = await call(`/subjects/${mathId}`, a.token, { method: 'PATCH', body: { name: 'Mathematics II', weeklyTargetMinutes: 420 } })
  check('PATCH /subjects/:id updates the subject', renamed.status === 200 && renamed.body?.data?.updated === true, JSON.stringify(renamed.body))
  const afterRename = await pg(`subjects?select=name,weekly_target_minutes&id=eq.${mathId}`)
  check('the update is stored in Postgres', afterRename?.[0]?.name === 'Mathematics II' && afterRename[0].weekly_target_minutes === 420, JSON.stringify(afterRename))

  const topic = await call(`/subjects/${mathId}/topics`, a.token, { method: 'POST', body: { name: 'Integration QA', estimatedMinutes: 60 } })
  const topicId = topic.body?.data?.id
  check('POST /subjects/:id/topics creates a topic', topic.status === 201 && Boolean(topicId), JSON.stringify(topic.body))

  const detail = await call(`/subjects/${mathId}`, a.token)
  check('subject detail includes its topic', detail.body?.data?.topics.length === 1 && detail.body.data.topics[0].name === 'Integration QA', JSON.stringify(detail.body?.data?.topics))
  check('subject detail counts the topic in stats', detail.body?.data?.subject.stats.topics === 1, JSON.stringify(detail.body?.data?.subject.stats))

  const topicEdit = await call(`/topics/${topicId}`, a.token, { method: 'PATCH', body: { status: 'in_progress' } })
  check('PATCH /topics/:id updates a topic', topicEdit.status === 200 && topicEdit.body?.data?.updated === true, JSON.stringify(topicEdit.body))

  const task = await call('/tasks', a.token, { method: 'POST', body: { title: 'QA task', subjectId: mathId, topicId, estimatedMinutes: 45, priority: 'high' } })
  check('a task can link to the Postgres subject and topic', task.status === 201, JSON.stringify(task.body))
  check('the task hydrates the subject label from Postgres', task.body?.data?.task.subjectName === 'Mathematics II', JSON.stringify(task.body?.data?.task))
  check('the task hydrates the topic label from Postgres', task.body?.data?.task.topicName === 'Integration QA', JSON.stringify(task.body?.data?.task))

  const tasks = await call('/tasks', a.token)
  check('GET /tasks lists the linked task once', tasks.body?.data?.items.length === 1, JSON.stringify(tasks.body?.data?.items?.length))

  const badTask = await call('/tasks', a.token, { method: 'POST', body: { title: 'Ghost', subjectId: '00000000-0000-4000-8000-000000000000', estimatedMinutes: 30 } })
  check('an unknown subject is rejected', badTask.status === 422 && badTask.body?.error?.code === 'unknown_subject', JSON.stringify(badTask.body))

  const assessment = await call('/assessments', a.token, { method: 'POST', body: { title: 'QA midterm', subjectId: mathId, dueAt: Date.now() + 3 * 86_400_000 } })
  check('an assessment can link to the Postgres subject', assessment.status === 201, JSON.stringify(assessment.body))
  const assessments = await call('/assessments', a.token)
  check('the assessment hydrates its subject label', assessments.body?.data?.items[0]?.subjectName === 'Mathematics II', JSON.stringify(assessments.body?.data?.items))

  const dashboard = await call('/dashboard', a.token)
  check('dashboard reads subjects through the directory', dashboard.body?.data?.subjects.some((item) => item.name === 'Mathematics II'), JSON.stringify(dashboard.body?.data?.subjects))

  const isolation = await call('/subjects', b.token)
  check("another user cannot see the first user's subjects", isolation.status === 200 && isolation.body?.data?.items.length === 0, JSON.stringify(isolation.body?.data?.items))

  const removedTopic = await call(`/topics/${topicId}`, a.token, { method: 'DELETE' })
  check('DELETE /topics/:id removes the topic', removedTopic.status === 200, JSON.stringify(removedTopic.body))
  const topicsAfter = await pg(`topics?select=id&id=eq.${topicId}`)
  check('the topic row is gone from Postgres', Array.isArray(topicsAfter) && topicsAfter.length === 0, JSON.stringify(topicsAfter))

  const removed = await call(`/subjects/${mathId}`, a.token, { method: 'DELETE' })
  check('DELETE /subjects/:id soft-deletes the subject', removed.status === 200, JSON.stringify(removed.body))
  const softDeleted = await pg(`subjects?select=id,deleted_at&id=eq.${mathId}`)
  check('the subject row is kept as history', softDeleted?.[0]?.deleted_at !== null && softDeleted?.[0]?.deleted_at !== undefined, JSON.stringify(softDeleted))

  const afterDelete = await call('/subjects', a.token)
  check('the deleted subject leaves the list', afterDelete.body?.data?.items.length === 1, JSON.stringify(afterDelete.body?.data?.items?.length))
  const tasksAfter = await call('/tasks', a.token)
  check('its tasks are removed with it', tasksAfter.body?.data?.items.length === 0, JSON.stringify(tasksAfter.body?.data?.items?.length))
} finally {
  for (const user of created) {
    await fetch(`${URL_BASE}/auth/v1/admin/users/${user.id}`, { method: 'DELETE', headers: adminHeaders })
  }
  const leftovers = await pg(`subjects?select=id&workspace_id=eq.${workspace}`)
  check('cleanup removes the workspace subjects', Array.isArray(leftovers) && leftovers.length === 0, JSON.stringify(leftovers))
}

console.log(failures === 0 ? '\nLive subject checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
