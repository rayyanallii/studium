# Studium architecture

The product, the boundaries and the order in which the remaining PRD surface is
built. Everything here describes the code that exists plus the migration path;
where a piece is not built yet it says so explicitly.

## 1. System map

```
Browser (React 19 SPA, Vite, Frosted UI)
  |  Supabase session in localStorage; every API call carries the access token
  v
Cloudflare Worker (Hono)  ── /api/*
  |  verifies the token with auth.getUser on every request
  |  same-origin check on mutations
  |  Zod validation, ownership checks, deterministic domain logic
  |
  ├── Supabase Postgres (RLS)   profiles, workspaces, study_preferences  ← live
  ├── Cloudflare D1 (SQLite)    subjects … focus_runs, study sets        ← porting next
  ├── R2 (FILES)                original uploads
  ├── Supabase Storage          study-materials bucket (private)         ← ready
  └── Experiential gateway      gpt-6-luna, server-side key only
```

Two database engines coexist during the migration. The rule that keeps that
honest: **each record has exactly one home.** `profiles` and `study_preferences`
are in Postgres; subjects, tasks, plans, sessions, focus runs and study sets are
still in D1. No row is written to both.

## 2. Request lifecycle

1. `GET|POST /api/*` → `requireUser` (auth) → `requireDb` (D1 schema).
2. `auth.currentUser` accepts a Supabase bearer token (verified with
   `auth.getUser`) or, on localhost only, the development identity.
3. `requireUser` also stores the raw token in context. Handlers that talk to
   Postgres build a client **with that token**, so RLS — not a service key — is
   the authorization boundary. No secret key is shipped to the Worker.
4. Handlers validate input with Zod, then act. Responses are always
   `{ success: true, data }` or `{ success: false, error: { code, message } }`.
5. Ownership for D1 rows is `owner_sub = <verified user id>` in every query;
   for Postgres rows it is `workspace_id` plus an RLS policy.

Why not the service role: a leaked Worker secret would expose every user's data,
and a bug in one `WHERE` clause would too. RLS keeps the invariant in one place.

## 3. Ownership model

```
auth.users ──1:1── profiles
    └──1:1── workspaces (is_default, exactly one)
                 ├── study_preferences (1:1)
                 ├── subjects ── chapters ── topics
                 ├── tasks, assessments (+assessment_subjects), study_goals
                 ├── availability_rules, availability_overrides
                 ├── materials ── material_chunks
                 ├── study_artifacts (summary | flashcards | quiz | notebook)
                 │      ├── flashcard_reviews, flashcard_schedules
                 │      ├── quiz_attempts ── quiz_responses
                 │      └── notebook_messages
                 ├── topic_progress
                 ├── study_plans ── study_sessions ── focus_runs
                 └── ai_generation_jobs, ai_generation_usage
```

`is_workspace_owner(workspace_id)` is a security-definer function compared
against `auth.uid()`; one policy shape covers 23 tables. Join tables and
`quiz_responses` resolve ownership through their parent row. Provisioning is a
trigger on `auth.users` (profile + workspace + preferences), with an idempotent
`ensureWorkspace()` fallback for accounts created before the migration.

## 4. Domains

### 4.1 Account and onboarding (Postgres, live)

`GET /api/me` returns identity, profile, preferences, capability flags and
counts. Onboarding writes `onboarding_step` on every step so refresh resumes,
then `onboarding_completed` gates the app shell. Theme is a preference, mirrored
to `localStorage` for instant paint. Deleting study data removes the workspace
(cascading Postgres rows), D1 rows and stored files; the auth account itself is
untouched.

### 4.2 Academic structure (D1 today)

Subjects carry colour, priority, difficulty and an optional weekly target;
chapters group topics; topics carry an estimate and a status. Deleting a subject
is a soft delete (`deleted_at`) so historical sessions keep their label.
Subject detail is a set of filtered projections of the same records — never
duplicated rows.

### 4.3 Tasks, goals and assessments (D1 today)

Tasks belong to a subject and optionally a topic/goal, with estimated and
completed minutes (two different numbers, never merged). Assessments may span
subjects through a join table. Due dates are timestamptz in Postgres; D1 stores
epoch millis. A task is "schedulable" only while its remaining minutes are
positive.

### 4.4 Availability (D1 today)

Weekly windows in the user's IANA zone plus per-date overrides. Validation
rejects end-before-start and overlaps; the database repeats the first rule as a
constraint. The scheduler works in 15-minute slots inside these windows only.

### 4.5 Materials and AI generation (D1 + R2 today, Supabase Storage ready)

Upload → private object → text extraction (`pdfjs-dist`, `mammoth`, AI for
images) → `extracted_text` and chunk rows → generation job with a bounded
context → validated structured output → editable draft → publish. Generation
failures leave the source intact and are retryable; nothing is fabricated when
the model fails. Quotas: `STUDY_AI_DAILY_LIMIT` (content) and `AI_DAILY_LIMIT`
(planning), counted per identity per rolling day.

### 4.6 Practice (D1 today)

- **Flashcards**: saved deck artifact, reveal-then-rate review. Target state is
  FSRS (`ts-fsrs`) with `flashcard_schedules` holding due dates and stability,
  and `flashcard_reviews` holding evidence. Current ratings persist but do not
  yet schedule; the tables exist for that switch.
- **Quizzes**: 4-option MCQs, one stored correct option, deterministic scoring
  on the server, attempts saved with answers. No LLM grading of MCQs.
- **Weak topics**: derived from quiz accuracy and `Again` ratings with a minimum
  sample size; below threshold the UI says `not_enough_data`, never a fake
  mastery percentage. `topic_progress` is the cache for those signals.

### 4.7 Planning (D1 today)

Stages: gather inputs → rank candidates (AI optional) → deterministic allocator
places work → validate → propose → user accepts. The model never picks a
timestamp. Hard constraints: availability only, no overlaps, nothing in the
past, daily cap, breaks, completed and locked sessions preserved. Deadlines that
cannot be met are reported as shortfall. Accepting a plan must be atomic; because
PostgREST has no multi-statement transactions, the Postgres port will wrap
accept/replan in a SQL function rather than a sequence of client calls.

### 4.8 Focus (D1 today)

Elapsed time is derived from `started_at`, `last_resumed_at` and
`accumulated_focus_seconds` on the server, so a background tab or refresh cannot
invent minutes. Finishing is idempotent and records time exactly once.

### 4.9 Analytics (D1 today)

One source of truth for time: `study_sessions.actual_minutes` plus standalone
`focus_runs`. Planned and actual are reported separately, as are time spent and
mastery evidence. Empty and insufficient-sample states are first-class.

## 5. Frontend architecture

- `src/app/App.tsx` owns routing: public auth routes, the onboarding gate, then
  the shell. A private URL while signed out goes to `/login?next=…`.
- `src/app/components/Shell.tsx` is the Whop-inspired frame: global header with
  search (`Ctrl/⌘K`), left rail, mobile bottom navigation, account popover.
- Pages fetch through `src/app/lib/api.ts` (React Query), which attaches the
  Supabase access token. Mutations invalidate the affected query keys.
- `src/shared/types.ts` is the contract between Worker and UI; no page invents
  its own payload shape.
- Frosted UI is the only general-purpose component library; product-specific
  widgets (flashcard, quiz option, calendar grid) are composed from its
  primitives and project CSS tokens.

## 6. Port plan

Each slice must keep the app working and be verified against the hosted database
before the next one starts.

| Slice | Moves to Postgres | Done when |
| --- | --- | --- |
| 1 | `profiles`, `workspaces`, `study_preferences` | **Done** — `/me`, profile and preference updates, account deletion; verified live |
| 2 | subjects, chapters, topics | Subject CRUD + stats read Postgres; `owner_sub` queries removed |
| 3 | tasks, goals, assessments, availability | Task list, counts and planner inputs read Postgres |
| 4 | materials + chunks, storage upload | Signed upload to `study-materials`; extraction status persisted |
| 5 | `study_artifacts`, reviews, attempts, notebook | Library, flashcard, quiz and notebook routes read Postgres |
| 6 | plans, sessions, focus runs | `accept_plan()` and `finish_focus()` as SQL functions (atomic), then delete the D1 schema |

Acceptance for every slice: typecheck, build, existing unit tests, `npm run
check:schema`, plus a live smoke test that creates two accounts and proves one
cannot read the other's rows.

## 7. Testing

- `npm run check:schema` — migrations, provisioning and RLS against real
  Postgres (PGlite).
- `npm test` — scheduling, availability math, AI output validation, MCQ scoring
  (`src/worker/lib/study-ai.test.ts`).
- Live smoke — admin-created confirmed user, password grant, `/api/me`, write
  and read, unauth 401, cleanup. Run against the dev server before shipping a
  data-layer change.
- Planned: Playwright for sign-up → onboarding → plan acceptance, review → due
  dates, quiz → recommendation, timer → analytics once.

## 8. Open decisions

- **Auth emails**: `mailer_autoconfirm` is off, so sign-up requires the
  confirmation link. Add the app origin and `/auth/callback` to the allowed
  redirect URLs.
- **Chapters**: the UI currently creates topics directly on a subject; the
  chapters level is modelled but not exposed yet.
- **FSRS**: adopt `ts-fsrs` with the existing `flashcard_schedules` columns
  instead of inventing a scheduler.
- **Long jobs**: extraction and generation are synchronous today. Move to
  `ai_generation_jobs` with polling before raising the document size limits.
