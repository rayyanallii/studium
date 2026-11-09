# Studium implementation status

## November 10, 2026: account flow and Supabase backend foundation

Authentication is now a complete account flow rather than a single opt-in page.
Public routes are `/`, `/login`, `/signup`, `/forgot-password`,
`/reset-password` and `/auth/callback`; every other path requires a Supabase
session, redirects to `/login?next=<path>` when signed out, and returns there
after signing in. The onboarding gate stays until `profiles.onboardingCompleted`
is true. The avatar popover carries identity, settings, a System/Light/Dark
control and sign out; signing out clears cached queries before leaving.

The Supabase project (email auth enabled) had no tables, so the backend was
written as versioned migrations: the full schema from PRD section 8, a
security-definer ownership function, RLS on every user-owned table, a sign-up
provisioning trigger that creates the profile, default workspace and study
preferences atomically, and a private `study-materials` bucket with per-user
path policies. `scripts/check-schema.mjs` applies those migrations to an
in-memory Postgres, simulates two auth users and asserts isolation, constraints
and provisioning; it passes.

The migrations are now **applied** to the hosted project, and the first data
slice has moved: `GET /api/me`, profile updates, preference updates and account
deletion read and write Postgres using the user's access token, so row-level
security — not a service key — authorizes every row. Subjects, tasks,
availability, plans, sessions, focus and study sets still use D1 until their
slices land; [architecture.md](architecture.md) records the order and the rules.

A live smoke test creates two confirmed accounts, provisions both workspaces,
edits a profile and preferences, proves each user can read only their own
profile, deletes one account, and confirms the other workspace survives. All
sixteen assertions pass against the hosted database.

## November 9, 2026: expanded study workspace with Frosted UI

The latest November 9 visual update uses Whop's official Frosted UI and adds
source uploads, AI flashcards, quizzes and a source-grounded notebook. See the
[current scope and roadmap](study-workspace-roadmap.md) for implemented behavior,
limits, verification and the next AI features. The section below records the
earlier foundation pass. The current design follows the supplied Whop reference:
near-black surfaces, white text, blue primary controls, larger Inter typography,
a full-width search header and wider neutral sidebar. The Next.js/PostgreSQL
migration remains outstanding. Typecheck, production build, six logic tests,
live AI generation and browser upload/study/planner checks passed locally.

## November 9, 2026: Base UI and visual foundation

The existing Vite/React/Hono application has been retained for this first
implementation. This is not yet the complete Next.js/Supabase MVP in the PRD.

### Design

The user's black-and-white direction supersedes the PRD's purple brand palette.
The palette uses canvas #101010, surface #171717, raised surface #202020,
border #2a2a2a, muted text #adadad, and primary text/action #f5f5f5.
Inter is the application typeface. Subject colors identify subjects; semantic
colors communicate status. Light mode uses the same layout and neutral tokens.

The dashboard leads with the daily schedule. A single divided metrics row
replaces four floating statistic cards. Navigation, account controls, and
secondary actions use quieter surfaces and consistent 7–12px radii.

Base UI supplies Button, Input, Select, Checkbox, Switch, ToggleGroup, Menu,
and Dialog primitives. The side panel also uses the Dialog primitive for focus
containment and modal behavior. Standard fields remain compatible with existing
forms. Motion respects the operating system's reduced-motion preference.

### Supabase integration

Supabase email/password login, registration, reset email, password update,
session refresh, and sign-out have been implemented as an opt-in auth adapter.
The Worker verifies bearer tokens with `auth.getUser` before accessing any data.
When Supabase is configured, a missing or invalid token does not fall back to
the local development user. No service-role key is needed for this adapter.

To enable it, configure BOTH sides with the same project:

1. Copy `.env.example` to `.env.local`, supplying the publishable key.
2. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.dev.vars` for local
   development, or Worker environment bindings for deployment.
3. Enable email/password auth in Supabase. Configure the app origin and allowed
   `/login` and `/dashboard` redirect URLs.
4. Restart the dev server and rebuild when browser environment values change.

This adapter has been typechecked and built. Live registration, confirmation,
and password-recovery email delivery have not been exercised. The local preview
continues to use its existing development identity and stored workspace.

Study data still lives in Cloudflare D1, scoped by the authenticated user ID.
Existing development data is not automatically assigned to new Supabase users.
The remaining PRD migration is Next.js routing/server actions, PostgreSQL tables,
row-level security, transactional scheduling, and a deliberate data migration.
Supabase SSR helpers should be adopted when Next.js replaces the current SPA.

### Verification

- TypeScript check and production build pass.
- Desktop dark/light and 390px mobile dashboard reviewed in a browser.
- Task creation through Base UI selects, persistence after reload, keyboard
  focus containment, modal dismissal, mobile navigation, and theme persistence
  checked with Playwright against the local application.
- Larger planner, focus, settings, and analytics routes load separately.
- Experiential gateway test used `gpt-6-luna` and returned
  `Studium gateway connected.` Usage: 14 input + 9 output = 23 tokens.

Original `supabase.md` setup notes contain credentials and are excluded from
Git. Environment files, build output, local databases, and browser artifacts
are also excluded. The public setup example contains no secret key.

### References

- [Base UI Dialog](https://base-ui.com/react/components/dialog)
- [Base UI Select](https://base-ui.com/react/components/select)
- [Base UI Menu](https://base-ui.com/react/components/menu)
- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase server token verification](https://supabase.com/docs/reference/javascript/auth-getuser)
