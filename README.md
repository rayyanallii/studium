# Studium

> **Auth and backend status:** Supabase Auth now owns accounts — sign-up, sign-in,
> password reset, session restore and sign-out — and the Postgres schema, RLS
> policies and private storage bucket are versioned in `supabase/migrations/` and
> verified by `npm run check:schema`. The hosted project still needs that SQL
> applied, and the workspace API still persists through D1 until the route-by-route
> move to Postgres. Setup, exact scope and next steps: [Supabase backend](docs/supabase-backend.md).

## Current implementation

Studium now includes a study library, AI flashcards, scored quizzes, and
source-grounded AI notebooks alongside the planner. Whop's official Frosted UI
provides controls, with near-black/white surfaces, blue actions, larger Inter
type, a full-width search header, and a wider sidebar. Upload PDFs, DOCX files and
pictures, or paste notes. See the [study workspace roadmap](docs/study-workspace-roadmap.md)
for current behavior and planned AI features. Use `npm test` for the study logic
checks. `STUDY_AI_DAILY_LIMIT` defaults to 30 calls per user per rolling day.

### Earlier foundation pass

The November 9, 2026 update adds Base UI controls, a neutral dark/white visual
system, a revised responsive dashboard and navigation, and configurable
Supabase email authentication. See [implementation status](docs/implementation-status.md)
for setup, validation, and remaining PRD work. The preview still uses Vite/Hono
and D1; the Next.js/PostgreSQL migration is not complete.

Run `npm install`, then `npm run dev`, and open `http://localhost:5173`.
Use `npm run typecheck` and `npm run build` to validate the source.
For Supabase auth, configure both `.env.local` and `.dev.vars` as described in
the implementation notes. Local development remains available without them.

## Existing template capabilities

An AI-assisted study planner: subjects, topics, tasks, assessments, weekly
availability, a generated study plan, a calendar you can reschedule, a
persisted focus timer, and analytics built only from confirmed study time.

Study workflows persist to D1. The local development identity and optional
sample workspace are for development. AI recommendations use the server-side
gateway when available; generation falls back to a deterministic scheduler
when it is unavailable and identifies that fallback in the proposal.

## Stack, and why it differs from the PRD

`prd.md` specifies Next.js + Supabase + OpenAI. This repo was already a
Cloudflare Workers template (`wrangler.jsonc`, `deploy.json`, Vite + React +
Hono, D1, Sign in with Freebuff). Rewriting it into Next.js on Supabase would
have meant rebuilding working infrastructure that cannot be verified from this
sandbox, so the app is built on the existing stack instead:

| PRD | Here |
| --- | --- |
| Next.js | Vite + React 19, single-page app served by the Worker |
| Supabase (Postgres + Auth + RLS) | Supabase Auth is wired; the Postgres schema and RLS policies live in `supabase/migrations/`. The workspace API still persists through Cloudflare D1 (SQLite), scoped by the verified user id server-side |
| OpenAI SDK | OpenAI-compatible gateway (`gpt-6-luna`) called with `fetch` from the Worker only |

The template provides auth, onboarding, subjects, tasks,
assessments, availability, AI-assisted generation with deterministic
scheduling, calendar rescheduling, focus timer, dashboard, analytics,
replanning, settings, and light/dark themes. Full PRD acceptance and the required
Next.js/Supabase storage architecture are still pending.

`sizing`/library notes: the calendar is a custom Luxon + CSS grid rather than
FullCalendar, so it matches the design tokens and reschedule flow exactly;
`react-hook-form` is not used (plain controlled forms); `anime.js` is used for
the landing hero only.

## Run it

```sh
npm install
cp .dev.vars.example .dev.vars   # fill in EXPLABS_API_KEY
npm run dev                      # http://localhost:5173
npm run build                    # dist/client + dist/study/index.js
npm run typecheck
```

On localhost without `FREEBUFF_CLIENT_ID` the Worker signs you in as a loopback
development user, so the whole app works before auth is provisioned. That path
can never activate on a deployed origin.

Settings → "Load sample workspace" adds three subjects, five tasks, three
exams and a planned week. It only runs when clicked, and replaces existing data
after a confirmation.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPLABS_API_KEY` | for AI | Gateway key. Server-side only; never sent to the browser. |
| `AI_BASE_URL` | no | Defaults to `https://api.experientiallabs.ai/v1`. |
| `AI_MODEL` | no | Defaults to `gpt-6-luna`. |
| `AI_DAILY_LIMIT` | no | AI recommendations per user per day (default 5). |
| `FREEBUFF_CLIENT_ID` / `FREEBUFF_ISSUER` | on deploy | Sign in with Freebuff. |
| `APP_ORIGIN` | on deploy | Canonical origin used for same-origin checks. |

Without a key the planner still works: it ranks work deterministically and says
plainly that AI suggestions were unavailable.

## How planning works

`POST /api/plans/generate` builds a proposal; nothing is written to the
calendar until `POST /api/plans/:id/accept`.

1. Open tasks and due assessments are ranked. With AI enabled the model returns
   priorities, duration estimates, subject emphasis and warnings; the response
   is schema-validated and every id is checked against the user's own rows.
2. The deterministic scheduler (`src/worker/lib/scheduler.ts`) turns that
   ranking into sessions: 15-minute grid, availability windows only, no
   overlaps, per-day ceiling, breaks between sessions, 10-minute fragments
   merged, nothing in the past. **The model never chooses a timestamp.**
3. The proposal is stored with `status = 'proposed'` and shown for review.
4. Accepting re-checks every slot against the current calendar, replaces the
   previous plan's unlocked future sessions, and inserts the rest.

Rescheduling a session manually is validated against availability and other
sessions; a conflict returns `409 scheduling_conflict` with alternative free
slots, which the UI offers as one-click moves. A moved session is locked so
replanning leaves it alone.

## Focus timer

Elapsed time is derived on the server from `started_at` / `last_resumed_at` /
`accumulated_focus_seconds`, never from a client counter. Pausing, refreshing or
backgrounding the tab cannot add or lose minutes. Finishing appends the
confirmed time exactly once (idempotent), optionally completes the linked study
session and task progress. Break time is never counted.

Analytics uses one source of truth: `study_sessions.actual_minutes` for planned
sessions plus standalone `focus_runs` (`study_session_id IS NULL`).

## Layout

- `src/worker/` - Hono API. `db.ts` owns the schema (created per isolate),
  `lib/scheduler.ts` the placement algorithm, `lib/ai.ts` the model call,
  `lib/availability.ts` slot validation, `routes/*` the endpoints, `seed.ts`
  the sample workspace.
- `src/app/` - React app. `pages/` the screens, `components/` the dialogs and
  primitives, `lib/api.ts` the typed hooks, `lib/format.ts` date helpers.
- `src/shared/types.ts` - the single contract shared by Worker and client.
- `src/styles.css` - design tokens for light and dark.

## API

All routes are under `/api` and require a signed-in user; mutations must be
same-origin. Responses are `{ success: true, data }` or
`{ success: false, error: { code, message, details? } }`.

```
GET    /me                      PATCH /me          PATCH /me/preferences
DELETE /account                 POST  /account/demo

GET    /subjects                POST  /subjects
GET    /subjects/:id            PATCH /subjects/:id       DELETE /subjects/:id
POST   /subjects/:id/topics     PATCH /topics/:id         DELETE /topics/:id

GET    /tasks                   POST  /tasks
PATCH  /tasks/:id               DELETE /tasks/:id
POST   /tasks/:id/reopen        GET   /tasks/:id/sessions

GET    /assessments             POST  /assessments
PATCH  /assessments/:id         DELETE /assessments/:id

GET    /availability            PUT   /availability
PUT    /availability/overrides  DELETE /availability/overrides/:id

POST   /plans/generate          POST  /plans/replan
GET    /plans/active            GET   /plans
POST   /plans/:id/accept        POST  /plans/:id/discard

GET    /sessions                POST  /sessions
GET    /sessions/summary        GET   /sessions/:id
PATCH  /sessions/:id            DELETE /sessions/:id
POST   /sessions/:id/complete   POST  /sessions/:id/skip

GET    /focus/active            POST  /focus/start
POST   /focus/:id/pause|resume|finish|abandon

GET    /dashboard               GET   /analytics?days=7|30
GET    /analytics/subjects/:id
```

## Security notes

- The AI key lives in the Worker environment and is only read by `lib/ai.ts`.
  No AI request is made from the browser.
- Every query is scoped by `owner_sub`; ids are never trusted for ownership.
- Mutations are same-origin, responses are `Cache-Control: private, no-store`.
- Study data deletion (`DELETE /api/account?confirm=delete`) removes only this
  app's rows - the Freebuff identity belongs to the sign-in provider.

## Credentials in the repo

`supabase.md` in this folder contains plaintext Supabase URLs/keys and the AI
key. **Supabase is not used by this app**, and nothing reads that file at
runtime. Treat those credentials as exposed: rotate them, and keep the file out
of version control. `.dev.vars` (real values) is gitignored; only
`.dev.vars.example` is committed.
