# Supabase backend

Studium's account system runs on Supabase Auth. The database schema, row-level
security policies and the private storage bucket are versioned under
`supabase/migrations/` and can be applied to the linked project
(`zicogvqcwgrstkfkbjeg`).

## 1. What exists today

| Layer | State |
| --- | --- |
| Auth (email + password, reset, sessions) | **Wired.** The browser signs in with `@supabase/supabase-js`; the Worker verifies the bearer token with `auth.getUser` on every `/api` request. |
| Postgres schema, RLS, provisioning trigger, storage bucket | **Applied** to `zicogvqcwgrstkfkbjeg`; the private bucket and RPC were verified live, and `npm run check:schema` covers the same migrations against an in-memory Postgres. |
| Workspace API (`/api/*`) | Account and academic-structure slices (profile, default workspace, study preferences, subjects, topics) read and write Postgres under the user's JWT. Tasks, availability, plans, sessions, focus and study sets still use D1 until their slices land — see [architecture](architecture.md#6-port-plan). |
| AI gateway | Server-side Experiential call (`gpt-6-luna`), unchanged. |

One record, one home: nothing is written to both databases. Profiles,
preferences, subjects and topics are Postgres; the domains listed above are D1.
The D1 loaders read subject labels through a directory built from Postgres rather
than joining the moved tables. Nothing in the app claims a database that is not
connected.

## 2. Environment

Browser (`.env.local`, Vite):

```
VITE_SUPABASE_URL=https://zicogvqcwgrstkfkbjeg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Worker (`.dev.vars` locally, environment bindings when deployed):

```
SUPABASE_URL=https://zicogvqcwgrstkfkbjeg.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Both halves must point at the same project. The publishable key is public; the
secret key is **not** used by the app and must never be committed or shipped to
the browser.

Browser auth calls do not go to `*.supabase.co` directly. `supabase-js` rewrites
its `/auth/v1/*` requests to `/api/auth/*` on the app origin, and the Worker
forwards them to the configured project with the server-side key. Sign-in,
sign-up, refresh, password reset and sign-out therefore keep working when a
browser extension, privacy setting or network blocks third-party requests; the
proxy only accepts same-origin mutations and only forwards to `/auth/v1/` on the
configured project.

With Supabase configured, `/login`, `/signup`, `/forgot-password`,
`/reset-password` and `/auth/callback` are the only public routes. Every other
path requires a session and returns to `?next=` after signing in. On localhost
without Supabase configuration the Worker keeps a loopback development identity
so the app still runs before credentials are provided; that path cannot activate
on a deployed origin.

In the Supabase dashboard, add these redirect URLs (Authentication → URL
Configuration) so email links come back to the app:

```
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
https://<your-domain>/auth/callback
```

## 3. Applying the migrations

### Option A — SQL editor (fastest)

Paste these files into the Supabase SQL editor, in order, and run each one:

1. `supabase/migrations/20261110000100_init.sql`
2. `supabase/migrations/20261110000200_rls.sql`
3. `supabase/migrations/20261110000300_storage.sql`

### Option B — Supabase CLI

```sh
supabase link --project-ref zicogvqcwgrstkfkbjeg   # asks for the database password
supabase db push
```

Verify inside the SQL editor afterwards:

```sql
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;
```

## 4. Schema notes

- `profiles` is keyed by `auth.users.id`; `on_auth_user_created` provisions the
  profile, one default `workspaces` row and `study_preferences` in the same
  transaction as sign-up.
- Every workspace-owned table carries `workspace_id`, so one policy shape covers
  it: `is_workspace_owner(workspace_id)`. A forged id in a request body cannot
  reach another user's rows.
- Join tables (`study_goal_subjects`, `assessment_subjects`) and `quiz_responses`
  resolve ownership through their parent row.
- `study_artifacts` stores generated summaries, decks, quizzes and notebook
  guides as JSON so drafts remain editable; `flashcard_reviews`,
  `flashcard_schedules` and `quiz_attempts` keep the evidence used by
  weak-topic recommendations.
- Constraints encode the product rules: availability windows must end after they
  start, MCQs keep one stored correct option, plans are unique per range and
  version, focus minutes cannot be negative.
- `study-materials` is a **private** bucket with a 10 MB cap, MIME allow-list and
  a policy that only lets a user read paths under their own `auth.uid()` folder.

## 5. Verification

```sh
npm run check:schema
```

The script boots an in-memory Postgres (PGlite), applies the migrations, creates
two simulated auth users and asserts:

- sign-up provisions a profile, one default workspace and preferences;
- a user sees their own rows and none of another user's;
- inserting into another workspace is rejected by RLS;
- invalid availability windows and orphan topics are rejected by constraints.

## 6. Next milestone

Move the workspace API from D1 to Postgres, route by route, using the service
role **only** on the server and the user's JWT for ownership context:

1. Workspace/account: `/me`, preferences, onboarding state.
2. Academic structure: subjects, topics, tasks, assessments, availability.
3. Planning: proposals, acceptance, sessions, focus runs.
4. Content: materials upload to the private bucket, artifacts, reviews, attempts.

Keep the response envelope (`{ success, data }` / `{ success, error }`) and the
deterministic scheduler unchanged; only the persistence edge should move.
