# Studium — AI-Powered Study Workspace

> **Product Requirements Document (PRD)**  
> **Version:** 2.2 (Frosted UI-exclusive, Whop-inspired application UX)  
> **Status:** Ready for implementation planning  
> **Platform:** Responsive web app (desktop, tablet, mobile)  
> **Type:** Personal EdTech productivity SaaS, architected for future multi-workspace/B2B expansion  
> **Primary goal:** Deliver an end-to-end working product, not a static UI demo.

---

## 0. Read This First — Instructions for the AI Coding Agent

You are responsible for implementing **Studium**, a polished, accessible, secure, maintainable AI-powered study workspace. Read this entire PRD before coding. First inspect the repository and preserve compatible existing work. Implement features **in phases**, with a functional vertical slice at the end of each phase. Do not generate an impressive-looking dashboard with mock data and call it complete.

**Non-negotiable requirements:**

1. A user has **one default personal workspace in MVP**. That workspace contains subjects; subjects contain chapters and topics; materials, notes, decks and quizzes can attach to subjects/topics. The global planner and analytics span all subjects.
2. The app connects **materials → AI content generation → practice/review → evidence of learning → adaptive planning → real study sessions → analytics**.
3. Use real authentication, persistent data, server-side authorization, private storage, AI API calls, and tests. Never fabricate AI results or user metrics.
4. **Frosted UI by Whop (`frosted-ui`) is the ONE AND ONLY general-purpose UI component/design-system library for the entire product.** Use it for the landing page, onboarding, auth, app shell, dashboard, forms, cards, navigation, dialogs, tables, practice UI, settings, and all other screens. **Do not install or import shadcn/ui, Watermelon UI, Untitled UI React, HeroUI, MUI, Chakra UI, Mantine, Ant Design, DaisyUI, or any other competing component kit.** See Section 6 for strict setup, exceptions, and fallback rules.
5. AI **recommends** priorities, explanations and learning content; deterministic services **validate** times, score objective questions, compute reviews and persist data.
6. In MVP, the app must remain useful if an LLM request fails. Provide retry, draft preservation, and deterministic planning fallback.
7. Preserve source attribution and user edits. AI-generated quiz and flashcard content must be editable before publication.
8. Validate all generated output with typed schemas; never execute content produced by a model.
9. Respect privacy and accessibility. Do not invent partnerships, testimonials, scores or usage statistics.
10. Do not claim a feature is complete until its acceptance criteria and relevant tests pass.
11. **Treat the attached Whop screenshots as binding visual references for the application shell, density, surfaces, interaction patterns, and multi-pane layouts.** Reproduce the general design language using Frosted UI, but create an original Studium-branded product—never reuse Whop logos, profile photos, account information, copy, or unrelated finance/chat features. See Sections 6.7–6.13 and `references/` in the accompanying design-reference bundle.

**Priority legend:** `P0` = required for first complete working release; `P1` = next release; `P2` = advanced/future. Build P0 before implementing P1/P2.

---

## 1. Executive Summary

### 1.1 Product definition

Studium is a personal **AI-powered study workspace** that helps students organize subjects and source materials, generate summaries/flashcards/quizzes, practice and review, manage deadlines, and follow adaptive study plans. Its defining differentiator is that study performance informs scheduling: a poorly understood topic becomes a candidate for targeted revision in the next calendar plan.

**Positioning statement:** *“Studium turns learning materials into personalized plans, flashcards, quizzes and adaptive revision — connected to your actual progress.”*

**Working tagline:** *“Plan smarter. Study better.”*

### 1.2 Problems being solved

- Learning materials are scattered across PDFs, notes, apps and folders.
- Students spend time manually turning information into practice material.
- Conventional calendars do not know which topics are difficult or due for review.
- Flashcards, quizzes, goals and focus timers often exist in disconnected apps.
- Students lose track of what they actually understand versus what they merely spent time on.
- Missed sessions and changing deadlines invalidate manually made timetables.

### 1.3 Target audience

Primary: high-school, university, competitive-exam and self-directed students managing multiple subjects. The MVP is a **single-user personal productivity product**; future B2B capabilities (schools, tutoring centers, cohorts) are architectural considerations only, not first-release functionality.

### 1.4 Product principles

- **One workspace, many subjects.** Avoid unnecessary workspace switching.
- **Subject organization, global intelligence.** Views are filtered projections of the same records.
- **Source-first learning.** Generated content links back to the user's own materials where possible.
- **Active recall over passive content.** Flashcards and quizzes are first-class workflows.
- **Adaptive, not intrusive.** Suggest schedule changes; require confirmation before applying them.
- **Evidence over vanity metrics.** Study minutes, quiz scores and review outcomes measure different things.
- **Minimalist, professional design.** Whop-inspired, dark-first, compact, premium application UI assembled with Frosted UI alone.

---

## 2. Scope and Delivery Plan

### 2.1 P0 — Full connected MVP

| Domain | P0 deliverables |
|---|---|
| Identity | Email/password login, sign-up, password recovery, protected routes, profile; optional Google OAuth if configured |
| Workspace | Automatic creation of one personal workspace; ownership checks; no user-facing switching |
| Academic structure | CRUD subjects, chapters, topics; subject colors, difficulty, priorities; flexible subject-level attachment |
| Goals and deadlines | Cross-subject study goals, assessments, task due dates, subject/topic targets |
| Content library | Upload PDF / add text / create notes; private storage, text extraction, search, source references |
| AI content | Editable summaries, flashcard drafts and MCQ quiz drafts generated from selected materials or pasted text |
| Flashcards | Deck management, flip-and-reveal review, Again/Hard/Good/Easy, spaced-repetition due dates, progress |
| Quizzes | Multiple-choice quizzes, timed/untimed mode, objective grading, explanations, per-topic outcomes |
| Planning | Availability editor, deterministic scheduling with AI prioritization, review proposal, accept, calendar day/week views |
| Adaptive learning | Weak-topic signals from quiz/review performance; due-card workload; suggested revisions and replanning |
| Focus | Start/pause/resume/end timers, accurate timekeeping, persistence after refresh, logged actual study time |
| Dashboard and analytics | Today's plan, due reviews, upcoming assessments, quiz/review activity, time-based and performance-based metrics |
| Settings | Timezone, preferred session length, max daily minutes, theme, profile, account deletion |
| Quality | Responsive design, accessible controls, meaningful empty/loading/error states, security, tests, deployment docs |

### 2.2 P1 — Studium Intelligence

- Contextual AI tutor using subject/topic/source context and cited retrieval results.
- “Ask your PDF” with document-level citation and relevance controls.
- AI study guides, formula sheets, guided explanations, Socratic tutoring.
- Adaptive quiz difficulty and additional short-answer/numerical question formats.
- More nuanced weak-topic diagnostics and recurring mistake analysis.
- Exam preparation plans and goal decomposition into milestones.
- Weekly AI learning insights and personalized daily briefing.
- Better workload estimation based on historical outcomes.

### 2.3 P2 — Advanced roadmap

- Mind maps and concept graphs.
- Lecture audio transcription and note generation.
- Full timed mock exams and question-paper analysis.
- Voice-based oral exams and AI study companion.
- Prerequisite-based personalized learning paths and careful readiness estimates.
- Calendar integrations, optional sharing/collaboration, multiple workspaces, school/team administration.
- Native mobile clients and subscription billing (only if needed).

### 2.4 Explicit exclusions from P0

Do not build collaboration, subscription checkout, AI voice, public feeds, document transcription, image occlusion, full LMS integrations, advanced RAG tutor, or multi-tenant organization dashboards before the core workflow passes end-to-end tests.

---

## 3. Information Architecture

### 3.1 Canonical hierarchy

```text
User
└── Personal Workspace (exactly one by default in P0)
    ├── Subjects
    │   ├── Chapters (optional organizational level)
    │   │   └── Topics
    │   ├── Materials (PDFs, pasted text, links [future])
    │   ├── Notes / AI Summaries
    │   ├── Flashcard Decks → Flashcards → Reviews
    │   ├── Quizzes → Questions → Attempts / Responses
    │   └── Subject Progress (derived)
    ├── Study Goals (may reference multiple Subjects)
    ├── Assessments / Deadlines / Tasks
    ├── Availability + Exceptions
    ├── Plans → Planned Sessions / Activities
    ├── Focus Runs and Learning Events
    ├── Global Practice Queue (aggregated across Subjects)
    ├── Analytics (aggregated across Subjects)
    └── AI Generation Jobs
```

### 3.2 Key ownership rules

- `workspace_id` is included on workspace-owned entities, even though each user only has one workspace at launch; `owner_user_id` (or membership) is enforced server-side.
- A subject is an organizational container, **not a separate workspace**.
- Chapter organization is optional: resources and tasks can attach directly to a subject, or to a chapter/topic.
- A flashcard deck or quiz exists **once**; subject screens and global Practice are filtered views of that same item.
- A goal or assessment can span multiple subjects through join tables. Do not duplicate subjects for different exams.
- Learning activity can be attached to topics even if generated from a subject-level document. Each generated item retains a source reference.
- In P0, no shared workspaces or role management UI; schema should not assume a forever single-subject scope.

### 3.3 Routing and navigation

**Public routes:** `/`, `/signup`, `/login`, `/forgot-password`, `/auth/callback`.

**App shell:** desktop sidebar; compact mobile navigation. Primary destinations:

| Route | Purpose |
|---|---|
| `/onboarding` | Guided account study setup |
| `/dashboard` | Daily plan + due reviews + recent progress |
| `/planner` | Calendar, scheduling, proposals, conflicts |
| `/subjects` | List, create and search subjects |
| `/subjects/[subjectId]` | Subject Overview, Chapters, Materials, Flashcards, Quizzes, Progress tabs |
| `/subjects/[subjectId]/topics/[topicId]` | Topic detail, learning resources, practice and progress |
| `/practice` | Aggregated due flashcards, quizzes, weak topics |
| `/practice/decks/[deckId]` | Deck details and review start |
| `/practice/review/[deckId]` | Flashcard study interface |
| `/practice/quizzes/[quizId]` | Quiz details, start and results |
| `/library` | Search/filter all notes, uploads and AI-generated resources |
| `/library/[materialId]` | Material viewer and generate actions |
| `/focus` | Standalone or linked focus timer |
| `/analytics` | Learning and study statistics |
| `/settings` | User profile, availability, preferences, appearance, account |
| `/profile` | Optional P1 dedicated user profile; P0 can present equivalent inside Settings |

**Navigation:** Dashboard, Planner, Subjects, Practice, Library, Analytics; Settings in lower section. Focus is accessible from the dashboard, study sessions and a persistent quick action; it can also appear in primary navigation if testing shows frequent standalone use.

---

## 4. End-to-End User Journeys

### 4.1 Journey A — First-run onboarding

1. User registers; auth and profile are created transactionally or with an idempotent provisioning process.
2. System creates the user's default workspace.
3. Onboarding collects academic context, learning goal, timezone, at least one subject, optional chapters/topics, upcoming exam dates, weekly study windows, default session/break lengths and max daily minutes.
4. User can skip optional deadlines/material uploads and resume onboarding after refresh.
5. User sees a review screen and may generate an initial study plan.
6. If no tasks/topics/reviews exist, show an actionable next step rather than fabricating sessions.
7. User reaches a real dashboard populated from stored data.

**Success:** A new user can create subjects, add one task or topic, set availability and generate a valid schedule.

### 4.2 Journey B — Add material and generate learning resources

1. Subject → Chapter/Topic (optional) → `Add Material`.
2. Upload a PDF, paste text, or write a note; select source name and target subject/topic.
3. Show `Processing` with meaningful status. Extract selectable PDF text, retaining page numbers; use OCR only as a fallback for unsupported scanned PDFs. Extraction errors should not destroy the original upload.
4. Show material viewer: document preview, extracted text status, and actions: `Summarize`, `Make Flashcards`, `Create Quiz`.
5. User chooses output settings (e.g., cards 10/20/custom within limit; MCQs 5/10/20; difficulty; selected pages/sections).
6. Server creates a generation job, invokes model with permitted source text and structured response schema, validates outputs and retains source references.
7. Display draft artifacts for review/edit; save/publish on explicit action. Failed generation is retryable.
8. Published artifacts appear under the subject and in global Library/Practice without duplication.

**Success:** One source material can produce a summary, deck and quiz, all saved, editable and source-linked.

### 4.3 Journey C — Flashcard review

1. User opens `Practice` or subject → Flashcards.
2. See cards due today, upcoming due count, deck progress and `Review Due` CTA.
3. Start review → card front → reveal answer → rate `Again / Hard / Good / Easy`.
4. Backend records `flashcard_review`, runs spaced-repetition scheduling (prefer maintained `ts-fsrs` implementation), updates next due date and card state.
5. At end show number reviewed and rating breakdown. Weak topic signal is updated from outcomes.
6. Due-card workload becomes eligible input to upcoming plan suggestions.

**Success:** Cards due dates follow saved review history, survive refresh and influence revision recommendations.

### 4.4 Journey D — Quiz and weak-topic suggestion

1. User opens saved quiz or generates one for a chapter/topic/material.
2. Set timed/untimed (when allowed); answers persist during quiz so refresh does not discard an in-progress attempt.
3. Submit; system scores MCQs against stored validated correct keys, not an LLM call.
4. Results show score, per-question feedback, explanations, cited source (when available), topic-level breakdown and suggested follow-up.
5. The weak-topic service calculates evidence from recent quiz/review outcomes with minimum sample thresholds. Display `Insufficient evidence` when appropriate, not false mastery numbers.
6. Offer `Add 30-minute revision to plan` or `Replan my week`; explain what will change.
7. Only on user approval is the new plan committed.

**Success:** Weak-topic activity becomes a candidate for planning without silently changing the calendar.

### 4.5 Journey E — Plan, study and adapt

1. Planner collects availability, due tasks, assessments, topic progress, due flashcards, quiz weak signals and preferred session settings.
2. AI recommends relative priority or task breakdown; deterministic allocator selects dates/times.
3. User reviews plan proposal with added/moved/unchanged sessions and overflow warnings.
4. User accepts, then opens today's session and launches appropriate activity (`Learn`, `Review`, `Quiz`, `Practice`, `Focus`).
5. Focus timer records actual focused time; quiz and card review record learning evidence independently.
6. On missed sessions, overdue revisions or new deadlines, dashboard offers a **replan preview**. Existing completed/manual-locked sessions are preserved.

**Success:** The scheduling system is responsive to learning data but respects user control.

---

## 5. Detailed Feature Specifications

### 5.1 Dashboard (P0)

**Primary questions:** What do I study today? What is due? Am I making progress?

Sections: greeting and date, next scheduled session + `Start`, today's planned/actual minutes, upcoming tasks/deadlines, due flashcards, recommended revision, seven-day activity, brief subject summaries, quick actions (`Add Subject`, `Add Material`, `Create Task`, `Generate Plan`).

Requirements:
- Statistics must come from actual persisted records.
- Distinguish **planned** vs **actual** minutes; distinguish **time spent** vs **mastery evidence**.
- Empty workspace and no-schedule states provide appropriate CTAs.
- Due reviews link directly to a review queue; recommendations must identify their evidence.

### 5.2 Subjects, chapters and topics (P0)

**Subject** fields: name, color, description (optional), priority (low/medium/high), difficulty (1–5), optional weekly target minutes.

**Chapter** fields: subject, title, position/order, optional description.

**Topic** fields: subject, optional chapter, title, description, estimated study minutes, state (`not_started/in_progress/completed`), optional prerequisite references (P1).

Requirements:
- CRUD with validation and confirmation before destructive actions.
- Subject detail tabs: Overview, Chapters, Materials, Flashcards, Quizzes, Progress.
- Chapter/topic detail show scoped materials, notes, decks, quizzes and tasks.
- Allow bulk-free creation and quick-add UX (no mandatory large wizard after onboarding).
- Maintain stable IDs; changing titles must not break references.
- Deletion must use explicit archive/soft-delete or safe cascades and preserve needed historical analytics where appropriate.

### 5.3 Study goals, exams, tasks, availability (P0)

**Goal:** title, description, optional target date, target outcomes; links to one or more subjects.

**Assessment:** title, subject(s), deadline datetime, priority, notes.

**Task:** title, subject, optional topic, optional goal/assessment, estimated minutes, due date, priority, status (`todo/in_progress/completed/archived`), completed minutes.

**Availability:** weekly local-time windows, per-date overrides, timezone, preferred session length, break length, max daily study minutes.

Requirements:
- Multiple windows per day and a day with no availability are valid.
- Reject invalid/overlapping windows and impossible durations.
- Use IANA timezone, UTC persisted timestamps, timezone-aware date conversion, DST edge case handling.
- Show insufficient-capacity warning rather than dropping tasks.
- Multi-subject goal connections use join records rather than duplicated academic entities.

### 5.4 Private Materials Library (P0)

Material types: PDF upload, pasted text, handwritten/typed text entered in editor. External URL ingestion is P1.

Requirements:
- Max file size/page count configured and shown before upload; MIME/type validation server-side.
- Private object storage with ownership-checked signed access; do not publish raw uploaded files.
- Extraction job states: `uploaded`, `processing`, `ready`, `failed`.
- Store extracted text sections with page references; present source preview.
- Support create/edit/delete note, rename/upload-replace material, search/filter by subject/type/topic.
- AI output saved as its own artifact referencing source version(s), not replacing the original.
- After replacing source, flag older outputs as `based on previous source version`; never silently rewrite them.
- Handle empty/unreadable/scanned PDFs with a clear message and fallback options; OCR is optional and must be scoped carefully.

### 5.5 AI Notes and Summaries (P0)

From material or selected text, generate:
- Concise summary with headings and key bullet points.
- Key terms and explanations.
- Optional review questions (as content, not automatically counted as graded quizzes).

Users can inspect, edit, save, rename, delete and trace summary sections to sources where available. AI-generated notes should display `AI-generated — verify against source` and offer links to cited passages. Keep a single reusable notes editor rather than multiple competing editors.

### 5.6 AI Flashcards + Spaced Repetition (P0)

**Generation settings:** selected material/section/topic; card count (default 10, configurable caps); basic Q&A vs cloze; difficulty (basic/intermediate/advanced); optional explicit learning objective.

**Card fields:** `front`, `back`, optional `hint`, `card_type`, `source_material_id`, source location, topic tags. AI produces a **draft**, user can edit/regenerate individual cards, delete irrelevant cards, then publish.

**Review UX:** one question at a time; reveal; Again/Hard/Good/Easy; keyboard shortcuts; progress counter; responsive layout. Use FSRS via `ts-fsrs` or a compatible maintained scheduler; persist scheduling state, retrievability-related values as required by the library and each review event. Re-review rules should not require AI calls.

**Analytics:** due now, studied today, review count, ratings and retention proxy where the algorithm supports it. Do not conflate deck completion with topic mastery.

**Guardrails:** prevent identical duplicate cards in a generation batch when detectable; keep source references; no infinite generation; retry on schema failures; do not promise perfect scientific accuracy from model output.

### 5.7 AI Quizzes (P0)

**P0 types:** 4-option single-correct-answer MCQ; question count 5/10/20 with configurable cap; easy/medium/hard; generated from selected text/material/topic or manually authored questions.

**Question model:** question, options (stable option IDs), correct option ID, explanation, topic ID, optional source material and page/section, difficulty.

**Flow:** generate draft → validate → edit/question preview → publish → start attempt → choose answers → submit → deterministic scoring → answer-by-answer explanations → topic performance → actionable recommendations.

**Quiz state:** status `draft/published/archived`; attempt status `in_progress/submitted/abandoned`; start/end timestamps; saved answers; optional countdown with server time reference; multiple attempts allowed, tracked independently.

**Guardrails:** no ambiguous answer keys knowingly published; validator ensures exactly one correct option and no duplicate option IDs; source-grounded factual checks where feasible; display `AI-generated — verify` indicator for generated content. In P0 **do not use the LLM to grade MCQs**.

### 5.8 Topic Performance and Weak-Topic Detection (P0)

Maintain evidence metrics per topic: recent quiz accuracy, number of questions answered, flashcard performance/review events, last practice date, planned/actual study time separately.

A simple, transparent starter system:
- `needs_attention` when quiz accuracy is low **and** a minimum recent sample exists, or repeated flashcard `Again` ratings exceed a configured threshold.
- `improving` with positive recent performance trend and adequate evidence.
- `not_enough_data` otherwise.

Thresholds are configuration, not validated scientific mastery claims. Avoid numeric `92% mastered` labels unless a meaningful calibrated model exists. Recommendations include why they were triggered and offer `Review cards`, `Take practice quiz`, or `Add revision to plan`.

### 5.9 Planner, AI Prioritization and Deterministic Scheduling (P0)

**Activity types:** `learn`, `review`, `quiz`, `practice`, `focus`. Activities reference the relevant subject, topic, optional task, deck, quiz or material.

**Inputs:** tasks/deadlines, upcoming assessments, subject difficulty/priorities, topics not yet covered, due review workload, weak-topic signals, availability, existing and completed events, manually locked events, max minutes/day, break settings, current time/timezone.

**Generation stages:**
1. Normalize and validate study inputs.
2. Determine candidate activities with estimated minutes; review blocks get time budgets and select due cards at execution time.
3. Optional AI recommendation service suggests priority, focus areas, workload breakdown and short explanations. Model output is parsed and validated against known IDs.
4. Deterministic allocator places candidate activities into legal slots, with 15-minute scheduling granularity (configurable).
5. Validate all constraints and compute unscheduled workload.
6. Show proposed plan (not active) with short justification and overflow warnings.
7. On explicit acceptance, atomically activate version and save sessions; reject/expire stale proposal if inputs have materially changed.

**Hard constraints:** no overlap, inside availability, no past scheduling, no commitment beyond daily cap, reserve configured breaks, respect deadlines where feasible, do not duplicate work, preserve completed sessions and user-locked events. For deadlines that cannot be met, clearly flag shortfall; do not invent impossible times.

**Soft priorities:** urgent deadlines, user priority, weak topics, due reviews, target-hour shortfalls, subject balance, avoiding excessive back-to-back sessions. These may be weighted heuristically and adjusted after user research; AI cannot overrule hard rules.

**Plan states:** `proposed`, `active`, `superseded`, `discarded`. Track version, creation/acceptance, comparison with previous plan; idempotent acceptance.

**Replanning:** triggered from missed session, deadline change, updated availability, new quiz weakness, high due-card load, or manual request. Generate a *diff preview*: moved, added, removed/canceled, untouched. Confirm before commit. Completed history remains immutable; locked sessions remain unless explicitly unlocked.

**Fallback:** if AI unavailable, deterministic rules generate a valid plan, clearly labelled as non-AI. Never fill with fabricated activities where no work exists.

### 5.10 Calendar and Sessions (P0)

- Day and week views (mobile defaults to day). Use a mature calendar library.
- Session cards show subject, activity, topic, start/end, duration, status.
- Open details, manually add, reschedule, skip, complete, start appropriate activity.
- Validate new slot before saving; offer alternatives on conflict. Manually moved sessions become locked by default.
- Statuses: `planned`, `in_progress`, `completed`, `partially_completed`, `missed`, `skipped`, `canceled`.
- Keep planned vs actual duration distinct; revising a plan does not erase actual work.

### 5.11 Focus Timer (P0)

- Start scheduled or standalone run; default 25 min, optional 50/custom.
- Pause/resume/end; optional break timer (break minutes excluded from study time).
- Use server timestamps / accumulated active intervals, not simple per-second decrement, so background tabs and refresh do not corrupt time.
- Store running/paused/finished state; avoid simultaneous overlapping active runs per user unless explicitly handled.
- End confirmation offers `Completed`, `Partially completed`, `Ended early` and actual focus minutes.
- Associate actual minutes with corresponding session exactly once; use idempotent completion and avoid double-counting.

### 5.12 Analytics (P0)

- Minutes studied per day and per subject; last 7/30 days.
- Planned vs actual hours; session completion rate with documented denominator.
- Quiz attempts, accuracy and trends by subject/topic (with sample counts).
- Flashcards due/reviewed, rating mix and review consistency.
- Upcoming deadlines, revision workload and topic statuses.
- Clearly communicate `no data` and `insufficient evidence` rather than inventing trends.
- Replanning changes future schedules without deleting completed history or recomputing past results incorrectly.

### 5.13 Contextual AI Tutor / Ask Your PDF (P1)

- Chat panel bound to current subject/topic/document, with an explicit option to change scope.
- Retrieval-augmented generation using approved owned source chunks; answers contain clickable source citations where possible.
- Suggested prompts: `Explain simply`, `Give example`, `Ask me guiding questions`, `Test my understanding`, `Turn this passage into flashcards`.
- Respect workspace/user authorization at retrieval time; never retrieve another user's chunks.
- Admit when source does not contain an answer. Prevent documents from overriding system instructions (prompt injection defence).
- Store chat history only with clear user control and bounded retention.

---

## 6. Visual Design and UI Component Strategy — FROSTED UI ONLY

> **Mandatory build constraint (overrides all older Studium specifications):** Use **Whop's Frosted UI** as the **exclusive general-purpose UI component library and design system** across the *entire* application, including the marketing site. Official repository: **https://github.com/whopio/frosted-ui**. Component examples and documentation: **https://storybook.whop.dev/**. **Never substitute an alternative UI kit, even for one screen or one missing component.**

### 6.1 Approved stack and UI dependency boundaries

| Layer | Requirement |
|---|---|
| Frontend | Next.js App Router + React + TypeScript |
| **Exclusive UI component library / design system** | **Whop Frosted UI — npm package `frosted-ui`** |
| Styling utilities | Tailwind CSS **only where compatible with Frosted UI's documented integration**, plus project-level CSS and Frosted UI theme variables |
| Icons | Follow Frosted UI's icon conventions; use Radix Icons if appropriate; never introduce a second UI component design system for icons |
| Motion / animation | Motion for React or Anime.js **only as animation utilities**, not as sources of alternative UI components; optional, not mandatory |
| Forms and schemas | React Hook Form and Zod for behavior/validation; use Frosted UI fields, controls and error presentation |
| Data visualization | Recharts or another purpose-built chart renderer **only for actual charts**; integrate into Frosted UI containers and theme |
| Calendar functionality | FullCalendar or another purpose-built calendar engine **only if needed for scheduling interactions**; style all adjacent controls, popovers and dialogs with Frosted UI |
| Backend | Next.js server actions/route handlers and domain services |
| Auth/database/storage | Supabase Auth, PostgreSQL, Storage, RLS |
| AI | OpenAI API behind server endpoints; configurable model |
| Async jobs | Durable worker/queue for PDF extraction and longer AI jobs |
| Review scheduling | `ts-fsrs` or a compatible FSRS implementation |
| Testing | Vitest + Playwright + API/RLS tests |
| Deployment | Vercel app + suitable durable worker runtime when needed |

**Banned as UI component sources:** shadcn/ui, Watermelon UI, Untitled UI React, HeroUI, Material UI, Chakra UI, Mantine, Ant Design, NextUI, DaisyUI, and other competing general-purpose component libraries. This applies to new work and pre-existing project dependencies/components. If migrating an existing codebase, replace their usage systematically instead of retaining two design systems.

**Permitted non-competing tools:** Tailwind (styling utility), charting libraries, dedicated calendar interaction engines, editors, icons, form state libraries, validation libraries, and animation engines. These are not permission to introduce a second general-purpose component system. If any such dependency introduces visible UI, customize it to match Frosted UI and use Frosted UI for surrounding primitives/controls.

### 6.2 Frosted UI installation and integration (must follow current upstream docs)

The official **current** repository is `whopio/frosted-ui`; install the package called **`frosted-ui`**, not the separate old/legacy `@whop/frosted-ui` package.

```bash
pnpm add frosted-ui
```

Import Frosted UI's stylesheet at the application root and wrap the application in its `Theme` provider:

```tsx
import 'frosted-ui/styles.css';
import { Theme } from 'frosted-ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Theme>{children}</Theme>
      </body>
    </html>
  );
}
```

This is a **conceptual Next.js App Router integration example**. Follow the repository README and Storybook for the correct configuration, available exports, React boundaries, hydration, theme setup, optional tooltip provider and any Tailwind integration. Check the pinned version and peer dependencies. Do not guess component names, imports, properties or providers. If the latest docs differ, follow verified upstream guidance and document the chosen version.

**Release caution:** Frosted UI is explicitly described by its maintainers as a work in progress with potential breaking changes. Pin a known-working package version, test upgrades, and avoid committing an unverified bulk dependency upgrade.

### 6.3 Exclusive component selection policy for the AI coding agent

1. **Before building any screen**, browse the Frosted UI Storybook and source to identify available primitives, components and patterns.
2. **Use Frosted UI's real exports** for all supported components: buttons, typography, surfaces/cards, form controls, labels, navigation, menus, tooltips, dialogs, tabs, badges, tables, and related UI **where present**. These are component categories to investigate, **not a guarantee that Frosted UI exposes a component with every listed name**.
3. **Compose missing product-specific UI using Frosted UI primitives + semantic React/HTML + local CSS/Tailwind**, rather than downloading an alternative component kit. A custom calendar cell, flashcard view, quiz option, or planner timeline is permitted when required by the app.
4. For an interaction not provided by Frosted UI, write a focused, reusable and accessible custom component **styled to match Frosted UI**, or use a purpose-built behavior engine that does not replace the design system. Do not recreate whole third-party design systems by copying their appearance.
5. **Never install a competing UI kit as a shortcut** (even if the coding agent thinks it would be faster). Do not use `shadcn` CLI, community component registries from competing design systems, or paste another kit's source components.
6. Apply Frosted UI colors, typography, spacing, radii, shadows and theme system consistently across marketing, auth, onboarding, dashboard, planner, practice, library, analytics and settings.
7. Keep forms, dialogs, popovers, buttons, and menus visually and behaviorally consistent. Preserve keyboard support, focus management, screen-reader labels, touch sizes and reduced-motion preferences.
8. Animations (if used) must be unobtrusive and cannot override Frosted UI's visual/interaction language. Avoid animating the same properties with multiple engines.
9. Validate the chosen Frosted components against actual package exports and compile the app, rather than inventing imports.
10. Record in the README that **Frosted UI is the exclusive component library** and include the upstream repository/documentation links and any version-specific caveats.

### 6.4 Visual Direction — Whop-inspired dark app aesthetic (MANDATORY)

**Visual benchmark:** The four user-provided screenshots in `references/` illustrate the desired **layout system**, *not* copyrighted branding to reproduce. Studium should immediately feel like the same family of highly polished dark desktop SaaS products. This is more specific than the earlier general description of a “minimal SaaS dashboard”. Build **Studium’s own study-specific information architecture** within this language.

**Screenshots packaged with this PRD** (all are reference-only):

| Reference file | What to learn from it | Adaptation for Studium |
|---|---|---|
| `references/01-whop-dashboard.png` | Fixed top bar, left sidebar, large open content field, restrained metric display, right-side supporting cards | Today's Study dashboard: next session, weekly progress, due cards, deadlines, quick actions |
| `references/02-whop-account-menu.png` | Avatar-aligned account popover, grouped menu items, separators, segmented appearance toggle | Studium user menu: Profile, Settings, Theme (System/Light/Dark), Sign out |
| `references/03-whop-profile.png` | Centered profile content, dark banner, overlapping circular avatar, sparse actions and tabs | Student profile: avatar, display name, study goals, subject overview, learning stats; no social/follower features in P0 |
| `references/04-whop-messaging-layout.png` | Three-column layout: app sidebar, searchable list/detail selection, focused right-side workspace | P1 AI Tutor / Ask Your PDF: left app nav, middle subject/material/chat list, right grounded conversation and source context |

**Overall personality:** understated, precise, quiet, premium, utilitarian, and highly consistent. Favor compact spacing and large *uncluttered* content regions rather than oversized decorative cards, gradients, colored tiles, illustrations, shadows, or endless floating widgets. Avoid an “AI-generated generic dashboard” appearance.

**Dark-first theme, light theme available:** Default to an elegant near-black neutral theme inspired by the references. Approximate *visual targets* for a fallback custom layer—not replacements for official Frosted tokens—are: canvas `#101010–#121212`; elevated surface `#202020–#252525`; selected navigation `#292929–#303030`; subtle separators `#2B2B2B–#343434`; primary text `#F4F4F5`; secondary text `#A0A0A5`; tertiary text `#77777D`. In implementation, inspect and use Frosted UI's semantic theme variables; never override component internals with scattered hardcoded hex values. Studium's suggested accent is `#635BFF`, used on focus, active indicators, primary CTA, links and meaningful progress states—not on every card. Do not copy Whop's orange emblem/brand accent.

**Typography:** neutral sans serif, readable white primary text, distinct muted metadata, moderate-weight headings. Page titles about 24–32 px; compact navigation labels ~14–16 px; metadata ~12–14 px. Use font/weight tokens that fit Frosted UI. Avoid flamboyant display text in the authenticated application.

**Surfaces:** flat black/charcoal backgrounds, 1 px low-contrast borders, medium rounded cards (roughly 12–18 px where appropriate), no excessive drop shadows, restrained hover/active states. Use icons with consistent line weight. The UI should be comfortable during long study sessions.

### 6.5 Desktop application shell — precise layout requirements

On desktop/tablet-width layouts, the app should resemble the screenshots' structural composition:

1. **Persistent top global header** spanning the width, approximately 64–72 px high (responsive). Left: Studium symbol/wordmark. Center: visible global search/command entry with search icon and keyboard hint (`Ctrl+K` on Windows/Linux, `⌘K` on Mac). Right: meaningful context actions (e.g., quick create, notifications if actually implemented) and user avatar. Maintain subtle bottom separator. **Do not add inert notification/chat icons** just to resemble the screenshot.
2. **Fixed/collapsible left rail** below the header, about 272–344 px on wide desktop screens, separated by a subtle vertical line. Upper rail: compact personal workspace switcher *visual* (only one personal workspace in P0) with one highlighted tile and no fake multi-workspace functionality. Group navigation under a quiet “Personal” or “Workspace” label. Navigation: Home/Dashboard, Planner, Subjects, Practice, Library, Analytics; Settings anchored near bottom. Active item is a wide muted-gray rounded rectangle with light icon + text, **not a large purple glowing slab**.
3. **Content region** takes remaining width; preserve generous horizontal margins and whitespace. Content can be centered inside a readable max-width container but should not force every page into identical dashboard tiles. Contextual right-hand panels appear only when the task calls for them.
4. **Dashboard composition:** airy, asymmetric, roughly two-thirds main content and one-third secondary column on wide screens. Main: today's study plan, next session, a quiet weekly activity chart and continue-learning section. Right: upcoming exams, reviews due, weak-topic prompts, AI recommendations; cards have clean outlines and no fabricated live feed.
5. **Search bar:** visually anchored near header center with subtle search icon and keyboard-shortcut pill. Implement command/search overlay with focus trap, clear empty state, Esc close, keyboard navigation. Scope results to current user: subjects, chapters, topics, materials, decks, quizzes; optionally route actions (Add task, Generate plan). `Ctrl/⌘+K` must actually work and must not intercept typing in editable content unexpectedly.
6. **Profile dropdown:** anchored to top-right avatar; dark elevated panel with grouped rows, separators, avatar/name header, Profile, Settings, Help (only if implemented), Sign out; compact segmented System/Light/Dark control in footer. Outside click/Esc closes, keyboard and screen reader interactions work. Do not copy screenshot's user identity or irrelevant menu options.
7. **Left sidebar behavior:** active nav indicator, focus/hover feedback, proper scrolling for long subject lists, bottom-anchored settings control, and working collapse toggle. Persist collapsed state locally as appropriate. Do not create nonfunctional `+` workspace controls or social navigation.
8. **No giant dashboard metric tiles:** prefer one or two prominent numeric metrics and subtle inline trends, similar to reference's large balance figure and understated chart. Transform the *pattern* into actual study minutes/weekly completion, not financial metrics.

### 6.6 Primary screens — Whop layout adaptations

**Dashboard `/dashboard`**: Use reference `01-whop-dashboard.png` composition. Left: today's planned study minutes, schedule timeline, weekly study activity; optional subtle chart. Right: “Due for review”, “Upcoming deadlines”, “Suggested next step” grouped in outlined dark panels. Responsive, truthful empty states. Keep at least one obvious real action: Start session, Review flashcards, or Generate plan.

**Profile `/profile` (P1 optional) / account detail in `/settings` (P0)**: Use reference `03-whop-profile.png` layout. Centered profile area, calm dark banner strip, overlapping avatar, editable display name and personal study info, subject/learning overview. Do **not** add follower counts, social connections, join dates unless genuine/relevant. If P0 does not expose a separate profile route, make profile section inside settings follow this pattern.

**Account popover**: Use reference `02-whop-account-menu.png`. Proper group hierarchy, separators, icons, footer theme switcher; accessible and fully functional.

**AI Tutor `/tutor` (P1) and document chat**: Use reference `04-whop-messaging-layout.png`. Three-pane desktop system: global nav left; chat/subject/material selection in middle (search field, source filters, recent threads); main chat on right (empty state with invitation or current conversation with source links). In P0, a material viewer with a source list can reuse the two-pane subset of this structure. **Do not implement social messaging or DM features**; the resemblance is strictly layout/interaction.

**Subjects**: Compact selectable list/grid, with subject view tabs (Overview / Chapters / Materials / Flashcards / Quizzes / Progress) and side-context as needed; minimize nested borders and decorative category cards. Follow same global header and sidebar.

**Planner**: Central calendar/timeline with calm charcoal grid lines, left-anchored controls and compact contextual session inspector; preserve readability and keyboard access. No large floating wizard where a simple side panel suffices. Color-coded session types should stay muted and distinguishable without color.

**Practice**: Deck/quiz list on one side, active study/review pane on the other when useful. Use the same empty-state and list-selection patterns as the three-pane reference. The flashcard itself may be intentionally larger and distraction-free.

**Library**: Searchable material list and preview split layout; user can open a document without leaving all contextual navigation. Generated artifacts displayed as concise list rows, with meaningful statuses.

**Auth/onboarding/landing**: Frosted UI remains the exclusive component library. These can use more focused, branded compositions than the authenticated shell, but keep typography, theme and component identity coherent. Do not build a cloned Whop marketing site.

### 6.7 Navigation, interaction and micro-behavior

- Hover states: subtle surface change, 120–180 ms; active navigation is a steady neutral fill. No aggressive bouncing, glowing or sliding.
- Dropdowns and menus: appropriate dark elevated surface, crisp 1 px border, consistent row heights, easy pointer targets.
- Tabs: simple underlines or understated selection styles where appropriate; no bulky segmented controls for every navigation group.
- Dashboard numbers: show real user data and genuine empty/zero states.
- Skeletons, toasts, confirm dialogs and popovers must look like the same Frosted UI design family.
- Respect `prefers-reduced-motion`. Motion for React/Anime.js may animate app-specific behavior only, not replace Frosted UI components.
- Provide a system theme option, dark default for new users if no system preference exists (document resolution), light theme with deliberate readable contrasts.
- App content must not use unnecessary “glass” blur; screenshots predominantly show **flat opaque dark surfaces**.

### 6.8 Responsive behavior

- **Wide desktop ≥1280 px:** global header + persistent nav rail; dashboard may use main plus right utility column; AI Tutor may use three panes.
- **Small desktop/tablet ~768–1279 px:** narrower/collapsible rail; dashboard secondary column stacks below or becomes a contextual panel; Tutor becomes two panes.
- **Mobile <768 px:** header remains compact; sidebar becomes a drawer or functional bottom navigation; global search opens full-screen command dialog; profile menu fits screen width; cards and forms use fluid width; Tutor uses list→conversation drill-down; planner defaults to day view.
- No horizontal overflow in auth, subject, practice, or planner screens; test keyboard and touch.

### 6.9 Reference packaging, originality and screenshot usage

The exact four user-provided PNGs are included under `references/` in the companion ZIP. They are **design references**, not app assets. The coding agent must inspect them *before* UI implementation. The high-level screen compositions, spacing, dark surfaces and interaction patterns are approved to emulate. Do not embed screenshots in the production app or copy Whop's logo, name, exact icons, user profile, marketplace metrics, proprietary content, and brand-specific wording. Create a distinctive Studium brand.

If only this Markdown file is supplied without its `references/` folder, the exhaustive descriptions above must be sufficient to implement the visual direction; request the four screenshots only if exact visual comparisons are needed. A missing screenshot must not block unrelated backend work.

### 6.10 UI quality gate and implementation acceptance

- [ ] Root uses verified Frosted UI theme/styles; other general-purpose UI kits are absent.
- [ ] Global header, left navigation rail, selected item, search and account popover visually match the **design language** of references 01–02, not merely their existence.
- [ ] Header search `Ctrl/⌘+K` functions, has accessible keyboard navigation and returns authorized user results.
- [ ] Avatar popover includes working theme controls, navigation and sign-out.
- [ ] Dashboard structure echoes reference 01 with study-centric main area and narrower utility column, using real data only.
- [ ] Profile follows reference 03's compact centered identity pattern without copying social product features.
- [ ] P1 Tutor layout follows reference 04's 3-pane shell and does not introduce messaging/social functionality.
- [ ] No Whop trademarks, account images, marketplace data or screenshot crops are present in production assets.
- [ ] Visual audit at 1440×900 desktop, 1024×768 tablet and 390×844 mobile; compare spacing, density, colors, borders, menus, typography and functional states.
- [ ] Mobile layouts collapse gracefully and remain keyboard/screen-reader accessible.
- [ ] Visual polish is evaluated after core functionality is verified; no placeholder widgets remain.

---

## 7. Technical Architecture

### 7.1 Modular monolith design

```text
Browser (Next.js React UI)
  |
  | authenticated calls / server actions
  v
Backend/API (auth + ownership + Zod + rate limits)
  |-- Workspace/Subject/Content services
  |-- Tasks/Goals/Availability services
  |-- Planner + deterministic scheduling service
  |-- Practice service (quizzes, flashcards, FSRS)
  |-- Analytics service
  |-- AI job dispatcher / AI recommendation service
  |
  +--> Supabase Postgres (RLS) + Storage (private PDFs)
  +--> Durable job queue/worker
             |-- PDF text extraction and source indexing
             |-- Summary / flashcard / quiz generation
             |-- Validate output + write draft artifacts
             +--> OpenAI API (server-side credentials)
```

A worker is appropriate for large PDFs and longer AI jobs; do not run long-lived job loops in a request handler that may be terminated by serverless limits. Implement durable statuses, idempotency, retry limits, and cancellation if supported. Early development may use shorter synchronous jobs only behind the same service interface.

### 7.2 AI content pipeline

1. Validate upload and workspace ownership.
2. Write private blob and material metadata.
3. Extract text/pages (PDF with text layer first). Keep extraction metadata and source version.
4. Split into bounded sections with stable IDs and page/offset metadata. Generate embeddings in P1 when RAG is needed.
5. Build scoped, bounded context for generation; avoid sending entire oversized PDFs in one uncontrolled prompt.
6. Call configured model using a constrained system prompt and JSON-schema/structured output.
7. Parse and validate output, enforce known IDs and source references, run lightweight duplicate/quality checks.
8. Persist as editable draft and expose preview/retry state.
9. Publish only after user approval.

For P0 generation, direct selected-chunk context is enough; vector retrieval becomes useful for P1 cross-document tutoring. If choosing vector search, use owned `pgvector` records with explicit workspace filtering or a managed provider with equivalent isolation.

### 7.3 AI division of responsibilities

| AI responsibility | Deterministic responsibility |
|---|---|
| Summaries and flashcard question/answer suggestions | CRUD, user permissions, source versioning |
| MCQ question/options/explanation generation | Validate MCQ shape and grade against answer key |
| Topic prioritization and plan explanation | Legal time-slot allocation, conflict detection, hard constraints |
| Study-guide and tutor explanations (P1) | Retrieval scoping, citations, access control |
| Semantic weak-topic suggestions | Measured quiz/review performance, minimum sample rules |

### 7.4 Reliability, cost and safety

- Secrets in server environment only. Never expose OpenAI API key or database service key to frontend.
- All model calls have timeout, bounded input/output, retries for transient failures, quotas and logging (without raw private content where avoidable).
- Configurable cap for AI generations (suggested starter: 5 expensive plan generations/day per user, separate content quotas).
- Do not trust model-generated identifiers or claims; validate against database entities and source text.
- Preserve user drafts and avoid charging/retrying repeatedly on double-clicks by idempotency keys.
- Provide transparent model failure: fallback plan can be heuristic but must not be labelled AI-generated.
- Uploaded text is *data*, never a source of system or developer instructions.

---

## 8. Database Model (Supabase PostgreSQL)

Use UUID primary keys, `created_at`/`updated_at`, foreign keys and indexes. Keep UTC timestamps and a user's IANA timezone. Apply RLS to all user-owned tables and perform explicit server checks for joined resources. The following is a **logical schema**: refine column types and constraints in migrations, preserving relationships.

| Table | Key fields / purpose |
|---|---|
| `profiles` | `id` (= auth user), `display_name`, `timezone`, `academic_context`, `onboarding_step`, `onboarding_completed` |
| `workspaces` | `id`, `owner_user_id`, `name`, `is_default`; enforce one default per user in P0 |
| `workspace_members` | **P2 reserved**: membership/roles; do not expose sharing in P0 |
| `study_preferences` | `workspace_id`, session length, break, max daily minutes, horizon, theme, planner style |
| `subjects` | `id`, `workspace_id`, `name`, `color`, `priority`, `difficulty`, `weekly_target_minutes` |
| `chapters` | `id`, `workspace_id`, `subject_id`, `title`, `position` |
| `topics` | `id`, `workspace_id`, `subject_id`, nullable `chapter_id`, `title`, `estimated_minutes`, `status` |
| `study_goals` | `id`, `workspace_id`, `title`, `target_date`, `description`, `status` |
| `study_goal_subjects` | `goal_id`, `subject_id` join |
| `assessments` | `id`, `workspace_id`, `title`, `due_at`, `priority`, `description` |
| `assessment_subjects` | `assessment_id`, `subject_id` join |
| `tasks` | `id`, `workspace_id`, `subject_id`, nullable `topic_id`/`goal_id`, `title`, `priority`, `due_at`, `estimated_minutes`, `status`, `completed_minutes` |
| `availability_rules` | `id`, `workspace_id`, `weekday`, `start_local_time`, `end_local_time` |
| `availability_overrides` | `id`, `workspace_id`, `local_date`, availability/unavailability local windows |
| `materials` | `id`, `workspace_id`, `subject_id`, nullable `chapter_id`/`topic_id`, `type`, `title`, `storage_path`, `version`, `extraction_status` |
| `material_chunks` | `id`, `material_id`, `material_version`, `workspace_id`, `text`, `page_start`, `page_end`, `sort_order`, optional `embedding` (P1) |
| `notes` | `id`, `workspace_id`, `subject_id`, optional `topic_id`, `title`, `content`, `origin` (`user/ai`), `source_material_id`, `source_version`, `status` |
| `flashcard_decks` | `id`, `workspace_id`, `subject_id`, nullable `topic_id`, `title`, `status`, `generation_job_id` |
| `flashcards` | `id`, `deck_id`, `workspace_id`, `front`, `back`, `card_type`, `source_material_id`, `source_chunk_id`, `topic_id`, `status` |
| `flashcard_schedules` | `card_id`, `workspace_id`, FSRS scheduling state, `due_at`, `last_reviewed_at` |
| `flashcard_reviews` | `id`, `card_id`, `workspace_id`, `rating`, `reviewed_at`, prior/new scheduling state snapshot |
| `quizzes` | `id`, `workspace_id`, `subject_id`, optional `topic_id`, `title`, `status`, `time_limit_seconds`, `generation_job_id` |
| `quiz_questions` | `id`, `quiz_id`, `workspace_id`, `question`, `options` (JSONB with stable IDs), `correct_option_id`, `explanation`, `topic_id`, `source_chunk_id`, `difficulty`, `position` |
| `quiz_attempts` | `id`, `quiz_id`, `workspace_id`, `status`, `started_at`, `submitted_at`, `score`, `max_score` |
| `quiz_responses` | `attempt_id`, `question_id`, `selected_option_id`, `is_correct` after submit |
| `topic_progress` | `workspace_id`, `topic_id`, evidence counts, recent accuracy, last practiced, status (derived/cache) |
| `study_plans` | `id`, `workspace_id`, `version`, `start_date`, `end_date`, `status`, `origin`, `input_fingerprint`, `explanation`, `accepted_at` |
| `study_sessions` | `id`, `workspace_id`, nullable `plan_id`, `subject_id`, `topic_id`, `activity_type`, linked `task/deck/quiz`, `starts_at`, `ends_at`, `planned_minutes`, `actual_minutes`, `status`, `is_locked` |
| `focus_runs` | `id`, `workspace_id`, nullable `study_session_id`, `started_at`, `last_resumed_at`, accumulated active seconds, `status`, `ended_at` |
| `ai_generation_jobs` | `id`, `workspace_id`, `kind`, `status`, idempotency key, source versions, selected settings, error code, created/completed timestamps, token/cost metadata where supported |
| `learning_events` | optional unified append-only event log for study/review/quiz aggregates; never make this a second inconsistent source of truth |

### 8.1 Important constraints

- Use composite workspace ownership checks for cross-table references; a topic in Subject A cannot be attached to a deck in Subject B by forged input.
- Enforce one active plan per relevant planning range/context; do not silently activate duplicate versions.
- Ensure unique request idempotency keys per user/operation.
- Protect against concurrent accepted proposals and concurrent timer finishes with transactions/locking.
- Delete/archive policies must not erase historical statistics unexpectedly. When a subject is removed, explicitly decide whether user wants hard deletion of related history.
- Restrict private storage paths and signed URLs by authenticated ownership.
- Data migration scripts must be reproducible; never require manual SQL edits after each deployment.

---

## 9. API and Server Action Contracts

Implementation may use route handlers or server actions, but must expose equivalent authenticated behavior. Standard error response: `{ success: false, error: { code, message, details? } }`. Success: `{ success: true, data, message? }`.

| Area | Suggested endpoints/actions |
|---|---|
| Profile/workspace | `GET /api/me`, `PATCH /api/profile`, `GET /api/workspace` |
| Academic structure | `GET/POST /api/subjects`, `GET/PATCH/DELETE /api/subjects/:id`, equivalent chapters/topics CRUD |
| Goals/deadlines/tasks | Goals, assessments and tasks CRUD endpoints with validated relationship IDs |
| Availability | `GET/PUT /api/availability`, date overrides CRUD |
| Material upload | `POST /api/materials/upload-init`, `POST /api/materials/:id/process`, `GET /api/materials`, `GET /api/materials/:id`, `DELETE /api/materials/:id` |
| Notes | `GET/POST /api/notes`, `PATCH/DELETE /api/notes/:id` |
| AI generation | `POST /api/ai/generate`, `GET /api/ai/jobs/:id`, `POST /api/ai/jobs/:id/retry` |
| Flashcards | Deck CRUD, card CRUD, `GET /api/reviews/due`, `POST /api/reviews/record` |
| Quizzes | Quiz CRUD, `POST /api/quizzes/:id/attempts`, `PATCH /api/attempts/:id/answers`, `POST /api/attempts/:id/submit`, `GET /api/attempts/:id/results` |
| Plans | `POST /api/plans/propose`, `POST /api/plans/:id/accept`, `POST /api/plans/replan`, `GET /api/plans/active` |
| Sessions | `GET/POST /api/sessions`, `PATCH /api/sessions/:id`, `POST /api/sessions/:id/complete` |
| Focus | `POST /api/focus/start`, `POST /api/focus/:id/pause`, `/resume`, `/finish` |
| Analytics | `GET /api/analytics?range=7d|30d`, `GET /api/topics/:id/progress` |
| Account | Update preferences; delete-account action with fresh confirmation/auth verification |

### 9.1 Common request rules

- Validate every input with Zod, including query params and nested IDs.
- Authenticate, authorize workspace ownership, check business constraints and only then mutate.
- Bound payload size and upload size; rate-limit expensive actions.
- For async generation return `{ jobId, status }` and use polling or realtime status updates.
- On failure provide stable user-safe error codes, no raw SQL or model credentials.
- Use cursor pagination for potentially large material/card/quiz lists.

### 9.2 Sample AI-generated flashcard schema (conceptual)

```json
{
  "source_material_id": "known-uuid-from-request",
  "cards": [
    {
      "front": "What is Newton's second law?",
      "back": "Net force equals mass times acceleration (F = ma).",
      "type": "basic",
      "topic_id": "known-topic-uuid-or-null",
      "source_chunk_id": "known-chunk-uuid-or-null"
    }
  ],
  "warnings": []
}
```

**Implementation:** enforce output shape, known IDs, bounded lengths, user-editable drafts, duplication checks and model refusal/error handling. AI output must not directly mutate published records before validation.

### 9.3 Sample recommended activity schema (conceptual)

```json
{
  "candidate_activities": [
    {
      "activity_type": "review",
      "subject_id": "known-subject-uuid",
      "topic_id": "known-topic-uuid-or-null",
      "deck_id": "known-deck-uuid",
      "estimated_minutes": 20,
      "priority_reason": "Several cards are due and recent reviews were difficult"
    }
  ],
  "warnings": ["Requested workload exceeds available time by 45 minutes"]
}
```

This is *not* a calendar result. The deterministic scheduler must turn validated candidates into actual times.

---

## 10. Screen-by-Screen UX Details

### 10.1 Landing page

**Visual rule:** Use the Frosted UI theme and Studium identity; Whop screenshots are app-shell references, not landing-page templates.


Hero: **“Your studies, intelligently planned.”** Subtitle communicates source-to-practice-to-plan workflow. CTA `Start Planning for Free`; secondary CTA `Explore Features`. Sections: How It Works (Organize / Generate / Learn & Adapt), Flashcards & Quizzes, Adaptive Planner, Study Progress, final CTA. Show authentic product preview, not fake usage metrics, testimonials or partnerships.

### 10.2 Onboarding

Progress steps: Academic context → Subjects → Goals/deadlines (optional) → Weekly availability → Preferences → Review/finish. Persist step state; allow back and resume. First plan CTA only when schedulable tasks/topics exist, otherwise guide to add content.

### 10.3 Subject detail

Header, subject color, key stats; tabs Overview / Chapters / Materials / Flashcards / Quizzes / Progress. Overview: continue learning, recent documents, upcoming deadline, weak topics, due reviews. Topic pages: resources and practice connected to that topic.

### 10.4 Library and material viewer

Search + filters by subject, topic, type, date; document list/grid. Viewer supports content preview, page references, status, generate actions, AI job progress, draft result preview and edits. Show source version warning if a generated resource references an outdated upload.

### 10.5 Flashcard review

Large centered card, reveal action, rating buttons, visible progress; keyboard support; reduced motion. End-of-review summary and next review estimate. Avoid confetti on every card.

### 10.6 Quiz runner and results

One question or compact paginated flow; timer if enabled; clearly marked submit; prevent duplicate submissions; answer review with explanations, source links and topic-level evidence. Provide practice/revision CTA.

### 10.7 Planner

Day/week views; activity type distinct from subject color; proposed plan review modal with session diff; manual drag/drop only if the calendar library supports accessible, conflict-validated behavior. Otherwise provide reliable edit dialog first.

### 10.8 Practice hub

Sections: `Due Flashcards`, `Available Quizzes`, `Recommended Revision`, `Recent Results`. Display evidence thresholds and avoid fake mastery percentages. Clicking a subject filter should not create a new dataset.

### 10.9 Analytics

**Visual rule:** Keep Whop-inspired dark styling, compact tabs and sparse chart decorations; do not fill the page with giant brightly colored KPI cards.


Study minutes per day and subject; planned vs actual; quiz accuracy with sample size; review activity; topic statuses. Date filter 7/30 days, accessible charts, meaningful no-data state.

### 10.10 Settings

**Visual rule:** Follow screenshot 02 for the top-right account popover and screenshot 03 for centered profile composition; menu and settings actions must work.


Profile, timezone, availability, focus/break lengths, theme, AI usage information and deletion controls. Account deletion confirmation explicitly states the impact on uploaded materials and learning history.

---

## 11. User Data, Privacy, Security and Accessibility

- Authentication: Supabase Auth, protected routes, secure session management and proper OAuth callback handling if enabled.
- Authorization: RLS for each user-owned table plus server-side ownership checks; no implicit trust in `workspace_id` received from client.
- Storage: private buckets, validated MIME, size restrictions, short-lived authorized signed URLs.
- Privacy: no unnecessary DOB, school identity or precise address. Explicitly disclose when uploaded learning materials are sent to an AI provider for generation.
- AI safety: source data is untrusted; prevent prompt injection; validate IDs; no unreviewed generated answers treated as guaranteed correct.
- Rate limiting and cost: per-user generation quotas, bounded documents, job retries, cancellation where supported.
- Accessibility: target WCAG 2.2 AA, keyboard operation, labelled forms, focus management, contrast, motion reduction, responsive touch targets, accessible charts and timer announcements.
- Observability: structured server errors with correlation IDs, failed job reasons, usage metrics; do not store secrets or complete private documents in ordinary logs.
- Data lifecycle: user-controlled deletion, source artifact cleanup, stale output management, backup/migration plan.

---

## 12. Acceptance Criteria / Definition of Done

**An MVP is not complete unless all the following work on a deployed application:**

### Account and organization

- [ ] A new user can register, authenticate and create exactly one default personal workspace.
- [ ] Onboarding survives refresh and can finish with valid academic preferences.
- [ ] Users can create/edit/delete subjects, chapters, topics, goals, tasks and assessments.
- [ ] Cross-user access to every private object and row is denied by test.

### Source materials and AI generation

- [ ] User uploads a valid PDF to a private bucket and sees processing status.
- [ ] Extracted text and page/source references are correctly tied to the material version.
- [ ] User can create a note, summary, flashcard draft and MCQ quiz draft from selected material.
- [ ] AI generation is a real server request, never a static hardcoded fake.
- [ ] Invalid model responses are rejected; failure and retry are supported.
- [ ] User can edit drafts and publish; published artifacts appear in subject and global views.

### Flashcards and quizzes

- [ ] Flashcard reviews record ratings, advance FSRS due dates and persist after reload.
- [ ] Due-card queue aggregates across subjects without duplication.
- [ ] MCQ answer key validates one correct option and quiz attempts persist.
- [ ] Quiz grading is deterministic and repeated submissions do not double score.
- [ ] Quiz results show question explanations, scores and topic evidence.

### Adaptive planning and execution

- [ ] Availability and date overrides validate correctly.
- [ ] User can propose, preview and accept an actionable schedule.
- [ ] Deterministic schedule never violates hard constraints in tested cases.
- [ ] Planned activities can include `learn`, `review`, `quiz`, `practice` and `focus`.
- [ ] Weak-topic/due-review suggestions can be added to a revised plan by user approval.
- [ ] Completed and locked sessions are preserved on replan.
- [ ] Insufficient capacity is communicated explicitly.
- [ ] AI outage falls back to correctly labelled non-AI scheduling.
- [ ] Focus timer survives refresh, pause/resume and background tab, with correct actual minutes.

### Data integrity, UX and delivery

- [ ] **Frosted UI (`frosted-ui`) is the ONLY general-purpose UI component library** across public and authenticated routes; no alternative UI kits or imported kit components are present.
- [ ] Whop-inspired screenshot references in `references/` have been reviewed; dark-first shell, sidebar, top search, user menu, dashboard composition and applicable multi-pane layouts match their design language using original Studium content.
- [ ] Frosted UI stylesheet/theme setup is verified against the installed package; all custom UI adheres to Frosted UI design language.
- [ ] Analytics use persisted activity, avoid double counting and distinguish evidence from time.
- [ ] Every major interface has loading, empty, error, success and retry states.
- [ ] Desktop and mobile core workflows are usable with keyboard and touch.
- [ ] Typecheck, lint, unit/integration tests, key Playwright tests and production build pass.
- [ ] `.env.example`, setup scripts, migrations, RLS policies, seed/dev fixture instructions and README exist.
- [ ] Deployed application works with real Supabase, file storage and AI credentials.

---

## 13. Test Plan and Edge Cases

**Unit test:** availability math; timezones and DST; priority weights; deterministic scheduling conflicts; short remaining tasks; deadline infeasibility; review due-date calculation; MCQ scoring; analytics aggregation; timer pause accounting.

**Integration test:** workspace provisioning; ownership checks; document ingest-to-draft pipeline; save/publish deck; review update; quiz attempts; weak-topic recommendations; plan acceptance and replan transactions; idempotent focus finish.

**Playwright end-to-end:**

1. Sign up → onboarding → subjects/topics → task → plan acceptance.
2. Upload PDF → extract → generate summary/cards/quiz → edit/publish.
3. Review cards → due dates update → practice hub refresh.
4. Take quiz → view topic evidence → accept revision recommendation → see changed planner.
5. Start focus → pause → refresh → resume → finish → analytics updates once.
6. Sign out/in → all data persists; another account cannot access it.
7. Mobile flow: navigation, material view, review, quiz, calendar, settings.

**Adverse cases:** zero availability; no work; multiple windows/day; overlapping windows; study capacity less than workload; deadline today; expired assessment; invalid PDFs; scanned PDFs; overly long files; empty extracted text; duplicate request; model returns malformed JSON; model invents source ID; upload interrupted; job timeout; user deletes source while job runs; timezone change; DST boundary; stale proposed plan; double quiz submit; concurrent focus runs; subject deletion with historic data; no evidence for mastery; accessibility reduced-motion preference.

Use future-relative dates in development seed data. Sample fixture may use Mathematics, Physics and Chemistry, but do **not** populate ordinary new user accounts with synthetic learning history.

---

## 14. Implementation Roadmap with Milestones

| Phase | Build | Must be demonstrably working before next phase |
|---|---|---|
| 1. Foundation | Next.js, TS, Frosted UI (`frosted-ui`) + theme/styles, compatible Tailwind, Supabase Auth, workspace provisioning, app shell, routing, migrations/RLS | New user signs up, workspace created, protected app loads |
| 2. Academic model | Onboarding, subjects/chapters/topics, goals/assessments/tasks, availability/preferences | Academic data CRUD persists, ownership tests pass |
| 3. Content pipeline | Private uploads, extraction, notes editor, material viewer, async jobs, source tracking | PDF can be uploaded/extracted and viewed securely |
| 4. AI Content Studio | Structured summary/card/quiz generation, draft edit/publish, quotas/retries | One PDF yields saved editable artifacts via real model |
| 5. Practice Engine | Flashcard review + FSRS, MCQ attempts/scoring, topic evidence | Review and quiz data persist and update recommendation signals |
| 6. Planner and Focus | AI priority helper, deterministic allocator, proposals, calendar, revisions, timer | Quiz weakness can generate an approved revision block; study activity recorded |
| 7. Dashboard/Analytics | Global views, study vs learning metrics, progress charts | Actual data visible throughout app; no duplicated counts |
| 8. Polish/QA/Deploy | Landing page, screenshot-reference-driven visual review, responsive/a11y, Frosted UI-only component audit, restrained animation, tests, docs, deployment | Full E2E flows pass in deployed environment |
| 9. P1 (later) | Tutor, RAG/pgvector, advanced practice, study guides, goals | Only after stable P0 release |

**Recommended working method:** implement thin, tested vertical slices rather than generating all screens first. Commit working milestones. After every phase run typecheck, lint and relevant tests, resolve errors, and record any blocked external credential requirements. If the repository already contains the original Studium Planner MVP, extend/refactor it without resetting persisted user data.

---

## 15. Future B2B Architecture (Do Not Build in P0)

The default personal workspace model permits later expansion to multiple workspaces owned by schools, tutoring organizations, or student groups. Reserve clear ownership/membership boundaries, but do **not** require workspace switching, invitations, organization billing, teacher dashboards, roles or cohorts in P0. In the future introduce `workspace_members`, roles (`owner/admin/teacher/student`), assignment sharing, organization-scoped resources, audit controls and enhanced data isolation; migrate with explicit compatibility tests.

---

## 16. Success Criteria and Portfolio Presentation

**First-release success is functional completeness and trustworthiness**, not a large number of AI features. Suggested product hypotheses (not achieved statistics): users can create a study plan within one onboarding session, generate useful practice material from a source, and complete at least one learning/review activity the same day. Track only with user-consented product analytics and explain metric definitions.

**Portfolio proof points:** public responsive deployment; documented user flows; authenticated Supabase database with RLS; working PDF ingestion and real AI generation; validated MCQ/FSRS engine; transparent scheduling algorithm; plans influenced by quiz/review outcomes; automated tests; thoughtful UI design system; architecture/README documentation.

---

## 17. Final Build Instruction

**FROSTED UI EXCLUSIVITY AND THE ATTACHED WHOP-INSPIRED VISUAL REFERENCES ARE HARD REQUIREMENTS:** Before generating or modifying screens, inspect the four `references/` screenshots and consult https://github.com/whopio/frosted-ui and https://storybook.whop.dev/. Install the current `frosted-ui` package, use its theme/styles and documented components, and do not introduce another general-purpose UI kit. If a needed component does not exist, compose it from Frosted UI primitives with accessible app-specific React/CSS. This constraint overrides earlier UI-library suggestions. Match the reference screenshots' dark, compact global header/sidebar, neutral active navigation, centered command search, structured account menu, airy dashboard and three-pane contextual patterns, but only with Studium-specific functionality and branding.

**Implement Studium as one coherent app, not six unrelated AI tools.** A student must be able to upload a Physics chapter, generate flashcards and a quiz, study them, see evidence of difficulty, approve a revision recommendation, follow the revised calendar and observe real progress in the dashboard. That complete loop is the product's core definition of done.

Where this PRD leaves implementation choices open, choose maintainable defaults and document decisions. Do not silently omit P0 scope; if a dependency or external credential is unavailable, provide a clearly identified configuration requirement or functional fallback. Treat the sections marked P1/P2 as roadmap only and do not invent their completed implementation.

**Official implementation references (verify versions at time of coding):**

- **Whop Frosted UI (exclusive UI library):** https://github.com/whopio/frosted-ui
- **Frosted UI Storybook/components/docs:** https://storybook.whop.dev/
- Optional animation utility — Motion for React: https://motion.dev/docs/react
- Optional animation utility — Anime.js: https://animejs.com/documentation/
- Supabase: https://supabase.com/docs
- OpenAI API: https://platform.openai.com/docs
- `ts-fsrs`: https://github.com/open-spaced-repetition/ts-fsrs

---

*End of Studium PRD v2.1 — Frosted UI-exclusive*
