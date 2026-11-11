# Studium

<div align="center">

![Studium Logo](public/favicon.svg)

### Understand. Practice. Remember.

**A rigorous, source-grounded AI study workspace and deterministic planner for serious academic workloads.**

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Hono-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Supabase Auth](https://img.shields.io/badge/Supabase-Auth_%26_RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-FCC72B?logo=vitest&logoColor=black)](https://vitest.dev/)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Why Studium is Different](#why-studium-is-different)
- [In-Depth Feature Showcase](#in-depth-feature-showcase)
  - [1. Universal Study Library](#1-universal-study-library)
  - [2. Active-Recall Flashcards](#2-active-recall-flashcards)
  - [3. Source-Grounded Quizzes](#3-source-grounded-quizzes)
  - [4. Source-Linked Notebooks & AI Assistant](#4-source-linked-notebooks--ai-assistant)
  - [5. Visual Concept Mind-Mapping](#5-visual-concept-mind-mapping)
  - [6. Adaptive Study Planner & Scheduling Engine](#6-adaptive-study-planner--scheduling-engine)
  - [7. Honest, Server-Persisted Focus Timer](#7-honest-server-persisted-focus-timer)
  - [8. Deep Work & Academic Analytics](#8-deep-work--academic-analytics)
  - [9. Visual Landing Page & Creative Experience](#9-visual-landing-page--creative-experience)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Directory Layout](#directory-layout)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Environment Setup](#installation--environment-setup)
  - [Running the Application](#running-the-application)
- [Security & Data Integrity](#security--data-integrity)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**Studium** is an intelligent academic study workspace designed for high schoolers, university undergraduates, graduate students, and competitive exam candidates. 

Unlike generic "AI wrappers" that fabricate answers, encourage passive reading, or make wild scheduling promises, Studium is built around **pedagogical discipline**:
- **Everything is grounded in your source material**: Textbooks, lecture slide decks, handwritten notes, and syllabi.
- **Active recall over passive review**: Turns documents into smart flashcards and verifiable practice quizzes.
- **No hallucinated schedules**: AI prioritizes workloads based on difficulty and deadlines, but a **strict deterministic scheduler** places sessions into validated time slots.
- **Tamper-proof focus tracking**: Elapsed focus time is derived server-side from timestamps, guaranteeing analytics reflect actual time spent learning.

---

## Why Studium is Different

| Typical AI Study Apps | Studium |
|---|---|
| **Hallucinates facts** without verifiable sources | **Source-Grounded:** Every notebook answer, quiz explanation, and flashcard cites exact passages from your uploaded documents. |
| **LLM chooses calendar slots**, creating impossible overlapping schedules | **Two-Tier Engine:** The AI ranks tasks; a deterministic scheduling algorithm (`src/worker/lib/scheduler.ts`) places sessions into 15-minute grids with strict conflict resolution. |
| **Client-side timer** that cheats or resets when switching tabs | **Server-Persisted Focus Timer:** Elapsed time is calculated on the server from `started_at` and `accumulated_focus_seconds`. Survives refreshes, background tabs, and browser crashes. |
| **Bloated, generic notes** | **Interactive Mind Maps & Visual Figure Triptychs:** Complex chapters are automatically transformed into hierarchical concept trees (`markmap-view`) and visual structural cards. |
| **Exposes API keys** to the browser | **Zero Client-Side Keys:** All model requests route through Cloudflare Workers with Zod schema validation, daily rate limits, and multi-tenant `owner_sub` isolation. |

---

## In-Depth Feature Showcase

### 1. Universal Study Library
Upload all your learning materials in one centralized, searchable repository.

```
Upload (PDF, DOCX, Image, Notes) ──> Client/Server Text Extraction ──> Segment & Index ──> Cloudflare R2 / Supabase
```

- **Multi-Format Ingestion**:
  - **PDF Documents**: Client-side text extraction powered by `pdfjs-dist`, capable of indexing multi-page textbook chapters.
  - **Word DOCX**: Structured text extraction preserving headings and paragraphs via `mammoth`.
  - **Lecture Photos & Handwritten Notes**: Vision AI OCR extracts readable study text from PNG, JPEG, and WebP images.
  - **Pasted Notes**: Direct text input with real-time character budget accounting.
- **Capacity & Limits**:
  - Supports files up to **10 MB** each.
  - Handles up to **80,000 characters** per source material.
  - A single generation set can combine up to **4 distinct sources** (totaling up to 100,000 characters) to synthesize cross-chapter understanding.
- **Integrity Guards**: Sources attached to saved decks, quizzes, or notebooks are protected from accidental deletion.

---

### 2. Active-Recall Flashcards
Transform dense readings into high-yield spaced repetition flashcards.

- **Configurable Deck Generation**:
  - **Card Count**: Generate compact 5-card summaries or deep 30-card mastery decks.
  - **Target Styles**: Select between *Conceptual*, *Definition*, *Scenario / Applied*, and *Formula / Proof* styles.
  - **Difficulty Scaling**: Adjust difficulty tiers to match introductory or advanced seminar coursework.
- **LaTeX Math Rendering**: Equations, integrals, matrices, and chemical notations are formatted and rendered using **KaTeX**.
- **Interactive Review Flow**:
  - Keyboard-navigable flip card interface (`Space` to flip, `Arrow` keys to navigate).
  - Track mastered cards with **Mark learned** and **Study again** status flags.
  - Persistent study progress: review history is preserved in the database across study sessions.

---

### 3. Source-Grounded Quizzes
Self-test your comprehension with verifiable practice exams.

- **Question Formats**:
  - Multiple-choice questions with plausible distractors designed to test subtle edge cases.
  - Free-response and short-answer prompts that require precise definition recall.
- **Deterministic Server-Side Grading**:
  - Answers are evaluated against the document's ground truth.
  - Every evaluated answer provides a clear explanation accompanied by direct verbatim quotations from the original material.
- **Attempt History & Analytics**:
  - Every quiz attempt records time taken, individual question selections, and score percentages.
  - Identifies weak topics to guide follow-up revision blocks.

---

### 4. Source-Linked Notebooks & AI Assistant
A private research environment that explains complex concepts without making things up.

- **Source Grounding**: The assistant answers questions strictly using your uploaded materials. If an answer cannot be deduced from the provided sources, the assistant explicitly states that the evidence is missing rather than fabricating facts.
- **Verifiable Citations**: Every claim is annotated with clickable citation pills displaying the exact source snippet.
- **Persistent Discussion Threads**: Multi-turn academic conversations are saved alongside your notes for future reference.
- **Markdown & Math Formula Editor**: Write personal synthesis notes alongside the AI dialogue with complete Markdown and KaTeX math formatting.

---

### 5. Visual Concept Mind-Mapping
For visual learners, Studium translates complex chapters into dynamic, interactive concept structures.

- **Markmap Integration (`markmap-view`)**: Renders dynamic, collapsible concept trees that map out the relationships between chapters, core principles, sub-topics, and definitions.
- **Figure Triptychs**: Generates visual comparison matrices and 3-part summaries for comparative analysis (e.g., contrasting physiological pathways, legal precedents, or architectural paradigms).

---

### 6. Adaptive Study Planner & Scheduling Engine
A realistic, stress-free calendar that adapts to real life.

```
1. AI Workload Ranking        2. Deterministic Scheduler       3. Calendar Integration
   (Tasks, Exams, Difficulty)  ──>  (15-min grid, no overlaps,  ──>  (Locked sessions,
                                     daily ceiling, breaks)            conflict resolution)
```

- **Two-Tier Engine**:
  1. **AI Workload Prioritization**: Evaluates task estimates, assessment due dates, and subject difficulty ratings (1–5). Generates recommended focus distributions, pacing suggestions, and burnout warnings.
  2. **Deterministic Placement Algorithm (`scheduler.ts`)**: Turns priorities into actual calendar blocks:
     - Enforces a strict **15-minute grid**.
     - Respects student **availability windows** (e.g., Mon/Wed evenings, Saturday mornings).
     - Adheres to **daily study ceilings** (e.g., max 4 hours/day) and inserts mandatory break buffers between sessions.
     - Automatically merges small 10-minute fragments into cohesive study blocks.
     - **Guarantees zero timestamps are chosen by an LLM**, eliminating invalid or hallucinated slots.
- **Interactive Calendar & Rescheduling**:
  - Drag-and-drop session rescheduling.
  - If a moved session causes an overlap, the system returns a `409 scheduling_conflict` with **alternative conflict-free slots** offered as one-click moves.
- **Locking & Non-Destructive Replanning**:
  - Manually scheduled or completed sessions can be locked.
  - Generating a new plan updates only unlocked future sessions, ensuring past history and manual adjustments are never overwritten.

---

### 7. Honest, Server-Persisted Focus Timer
A study stopwatch engineered for authentic accountability.

- **Zero Client-Side Cheating**: Elapsed time is computed on the server from `started_at`, `last_resumed_at`, and `accumulated_focus_seconds`.
- **Survives Any Disruption**: Pausing, closing the tab, restarting the browser, or background tab throttling cannot corrupt or inflate elapsed minutes.
- **Strict Break Isolation**: Paused break time is tracked separately and is **never** added to your confirmed study hours.
- **Idempotent Completion**: Completing a focus block writes verified minutes to the database, auto-advances the linked calendar session, and increments task progress.

---

### 8. Deep Work & Academic Analytics
Honest visual reports that reflect genuine study time rather than planned wishful thinking.

- **Planned vs. Actual Comparison**: Track completion efficiency over 7-day and 30-day rolling periods.
- **Subject Balance Radar & Charts**: Visualizes whether difficult subjects are receiving the required weekly target hours.
- **Focus Streaks & Milestone Badges**: Records consistent daily deep-work intervals and total hours logged.
- **Single Source of Truth**: All metrics derive exclusively from `study_sessions.actual_minutes` and confirmed `focus_runs`.

---

### 9. Visual Landing Page & Creative Experience
A landing experience built with modern visual engineering and zero framework bloat:

- **ASCII/Halftone Creation of Adam Hands (`DotHands.tsx`)**:
  - A real-time `<canvas>` simulation rendering horizontal scanlines of LED/halftone dots in Studium purple (`#9d7bea` on `#09080e`).
  - The two hands drift, breathe, and glitch-dissolve dot-by-dot between poses (Adam's pointing hand and open palm).
  - Features an intelligent elliptical quiet zone that clears dots behind typography for pristine legibility.
- **MagicUI Components**:
  - **`ShinyButton`**: Animated primary CTA with sweeping light sheen and smooth spring physics.
  - **`BentoGrid` & `BentoCard`**: Interactive feature cards with hover glow borders.
  - **`AnimatedBeam`**: SVG gradient beam visually connecting source documents to AI flashcards.
- **React Bits `<DitherVeil />`**:
  - WebGL dither veil powered by `ogl`, applying Atkinson and Floyd-Steinberg error diffusion dithering over an open textbook graphic.
  - Responds interactively to cursor hover reveals and click ripple bursts.
- **Interactive Typography (`MeshTextHover`)**: Radial cursor-following glow behind key headlines.

---

## Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   Vite 8 • Tailwind CSS v4 • Motion • Frosted UI      │
│   KaTeX • Markmap • Lucide • OGL (WebGL) • Luxon       │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON API /api/*)
┌───────────────────────────▼────────────────────────────┐
│              Cloudflare Worker (Hono)                  │
│   Multi-Tenant Context • Zod Validation • Scheduler    │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
    ┌─────────▼─────────┐       ┌─────────▼─────────┐
    │   Cloudflare D1   │       │   Cloudflare R2   │
    │   (SQLite Engine) │       │   (Object Store)  │
    └───────────────────┘       └───────────────────┘
              │                           │
    ┌─────────▼─────────┐       ┌─────────▼─────────┐
    │   Supabase Auth   │       │   OpenAI Gateway  │
    │   (JWT & RLS)     │       │   (gpt-6-luna)    │
    └───────────────────┘       └───────────────────┘
```

| Layer | Technologies | Role |
|---|---|---|
| **Frontend Framework** | **React 19** + **Vite 8** | Single-page application, high-performance client routing via `react-router` v8. |
| **Styling & Design System** | **Tailwind CSS v4** + **Frosted UI** | Whop-inspired dark aesthetic, precise design tokens, customizable themes (light/dark/system). |
| **Animation & Graphics** | **Motion**, **OGL**, **Canvas 2D** | Hardware-accelerated transitions, interactive WebGL dither shaders, dot-matrix hands. |
| **Academic Rendering** | **KaTeX**, **markmap-view** | LaTeX mathematical equation rendering and dynamic interactive mind maps. |
| **API & Server Runtime** | **Cloudflare Workers** + **Hono v4** | Ultra-low latency edge serverless backend; handles all AI requests and scheduling. |
| **Database & Persistence** | **Cloudflare D1** (SQLite) | Structured storage for subjects, tasks, calendar sessions, study sets, and focus runs. |
| **Authentication** | **Supabase Auth** | Secure email/password signup, password recovery, session restore, and RLS policies. |
| **Object Storage** | **Cloudflare R2** / **Supabase** | Private, secure storage for uploaded textbook PDFs, DOCX files, and note images. |
| **AI Gateway** | OpenAI-compatible gateway (`gpt-6-luna`) | Server-side LLM calls with strict JSON output schemas, guarded by daily quotas. |

---

## Directory Layout

```
studium/
├── docs/                       # Architecture specs, roadmaps, and audits
│   ├── architecture.md         # Full stack topology and database schema
│   ├── implementation-status.md# Progress and acceptance criteria
│   ├── product-flow.md         # End-to-end user journey
│   └── study-workspace-roadmap.md # Study engine design philosophy
├── public/                     # Static assets (favicons, fallback textures)
├── scripts/                    # Schema checks and build post-processing
├── src/
│   ├── app/                    # Client Application (React 19)
│   │   ├── components/         # Shared UI dialogs, widgets, and primitives
│   │   │   ├── magicui/        # Animated Beam, Shiny Button, Bento Grid, Marquee
│   │   │   ├── DitherVeil.tsx  # WebGL dither veil component (React Bits + ogl)
│   │   │   ├── DotHands.tsx    # Halftone LED Creation-of-Adam canvas animation
│   │   │   ├── MeshTextHover.tsx # Interactive cursor-following text glow
│   │   │   ├── NotebookWorkspace.tsx # Source-linked AI notebook & citations
│   │   │   └── StudyMath.tsx   # KaTeX formula renderer
│   │   ├── lib/                # API client hooks, formatters, PDF parsers
│   │   └── pages/              # Primary route screens
│   │       ├── Landing.tsx     # Hero-52 + Bento Grid + DitherVeil + Pricing
│   │       ├── Dashboard.tsx   # Daily cockpit, next session, task alerts
│   │       ├── Planner.tsx     # Interactive calendar grid & replanning
│   │       ├── StudyLibrary.tsx# Multi-format document manager
│   │       ├── StudySet.tsx    # Flashcard flip review & interactive quizzes
│   │       ├── Focus.tsx       # Server-persisted honest study stopwatch
│   │       ├── Analytics.tsx   # Planned vs. actual hours & subject breakdown
│   │       ├── Subjects.tsx    # Subject & syllabus topic managers
│   │       ├── Tasks.tsx       # Actionable assignment checklist
│   │       └── Settings.tsx    # Availability windows, preferences, demo seed
│   ├── shared/                 # Universal types, schemas, and study limits
│   │   ├── types.ts            # Single contract shared by Worker and Client
│   │   └── study.ts            # Flashcard, Quiz, and Notebook data contracts
│   └── worker/                 # Backend Edge API (Hono on Cloudflare Workers)
│       ├── db.ts               # D1 database connection and migrations
│       ├── env.ts              # Worker environment bindings
│       ├── lib/
│       │   ├── scheduler.ts    # Deterministic 15-minute study scheduler
│       │   ├── study-ai.ts     # Grounded flashcard, quiz & notebook generation
│       │   ├── availability.ts # Window verification & collision detection
│       │   └── http.ts         # Standardized API response formatters
│       └── routes/             # Modular Hono endpoints
│           ├── study.ts        # Library uploads, flashcard & quiz generation
│           ├── assistant.ts    # Source-grounded notebook chat
│           ├── plans.ts        # AI proposal ranking & calendar generation
│           ├── focus.ts        # Server-side tamper-proof timer state
│           ├── sessions.ts     # Calendar session mutations & locks
│           └── subjects.ts     # Subject and topic management
└── supabase/                   # Supabase migrations, Postgres tables & RLS rules
```

---

## API Reference

All backend routes are hosted under `/api` and require an authenticated session. Responses follow a standardized JSON envelope:
`{ "success": true, "data": ... }` or `{ "success": false, "error": { "code": "...", "message": "..." } }`.

### Account & Workspace
- `GET /api/me` — Retrieve active user profile, preferences, capabilities, and counts.
- `PATCH /api/me/preferences` — Update study style, session duration, break length, and themes.
- `POST /api/account/demo` — Populate the workspace with sample subjects, tasks, and exam data.

### Study Library & AI Generation
- `GET /api/study/materials` — List all uploaded textbooks, slide decks, and notes.
- `POST /api/study/materials` — Multi-part upload for PDF, DOCX, or Image notes with text extraction.
- `GET /api/study/materials/:id/file` — Secure download of the original document from storage.
- `POST /api/study/generate` — Generate active-recall flashcard decks or practice quizzes from selected sources.
- `GET /api/study/sets` — Fetch saved study sets, flashcards, and quizzes.
- `POST /api/study/sets/:id/review` — Persist flashcard review progress (`learned` / `review_again`).
- `POST /api/study/sets/:id/quiz-attempt` — Submit quiz answers for deterministic server scoring and feedback.

### Source-Grounded Notebook
- `POST /api/assistant/notebook` — Ask questions grounded in uploaded documents; returns verified citations.
- `GET /api/notebook/notes` — Retrieve student synthesized notes and linked source passages.

### Study Planner & Scheduling
- `POST /api/plans/generate` — Create a proposed study schedule based on deadlines and availability.
- `POST /api/plans/:id/accept` — Commit proposed sessions to the official active calendar.
- `POST /api/plans/replan` — Recalculate remaining future sessions without touching locked history.
- `GET /api/sessions` — Fetch scheduled sessions within a date range.
- `PATCH /api/sessions/:id` — Reschedule a session (returns alternative slots on conflict).

### Focus Timer
- `GET /api/focus/active` — Fetch current running or paused focus session with live server elapsed time.
- `POST /api/focus/start` — Initiate a focus block linked to a planned session or standalone topic.
- `POST /api/focus/:id/pause` / `resume` — Pause/resume timer without accumulating break minutes.
- `POST /api/focus/:id/finish` — Complete the session and commit verified study minutes to analytics.

### Analytics & Reporting
- `GET /api/analytics?days=7|30` — Aggregate deep work minutes, completion rates, and subject balance.
- `GET /api/dashboard` — Cockpit data: today's timeline, upcoming deadlines, and overdue tasks.

---

## Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher (tested on Node `v24.x`).
- **Package Manager**: `npm` (or `pnpm`).
- Optional: Cloudflare account (for D1/R2 deployment) and Supabase project (for hosted auth).

### Installation & Environment Setup

1. **Clone the repository**:
   ```sh
   git clone https://github.com/rayyanallii/studium.git
   cd studium
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Configure local environment**:
   Copy the example environment file:
   ```sh
   cp .dev.vars.example .dev.vars
   ```
   Edit `.dev.vars` with your settings:
   ```ini
   # Server-side AI gateway key (never exposed to browser)
   EXPLABS_API_KEY=your_api_key_here
   AI_BASE_URL=https://api.experientiallabs.ai/v1
   AI_MODEL=gpt-6-luna
   STUDY_AI_DAILY_LIMIT=30

   # Supabase Configuration (optional for local loopback dev)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Running the Application

- **Start Development Server**:
  ```sh
  npm run dev
  ```
  Open `http://localhost:5173` in your browser.
  *(Note: On `localhost` without Supabase keys configured, Studium automatically activates loopback development authentication, letting you explore all features immediately).*

- **Typecheck**:
  ```sh
  npm run typecheck
  ```

- **Run Test Suite**:
  ```sh
  npm test
  ```
  Runs 8 test suites covering PDF text parsing, KaTeX math parsing, scheduler collision algorithms, server scoring, and focus timer idempotency.

- **Production Build**:
  ```sh
  npm run build
  ```
  Compiles the React client bundle to `dist/client` and the Cloudflare Worker bundle to `dist/study/index.js`.

---

## Security & Data Integrity

- **Multi-Tenant Row Isolation**: Every database row across subjects, tasks, calendar sessions, and uploaded documents is bound to the verified `owner_sub` token. No request can inspect or alter data belonging to another user.
- **Zero Client-Side Credentials**: API gateway tokens and cloud keys exist exclusively inside the Cloudflare Worker runtime environment. No AI keys are sent to the client.
- **Idempotent State Machines**: The focus timer and calendar acceptance endpoints use idempotent state updates to prevent duplicate session writes during network retries.
- **Strict Content-Type & MIME Sniffing Protection**: File uploads verify byte magic headers (PDF `%PDF-`, DOCX zip signatures, PNG/JPEG headers) to prevent arbitrary file upload vulnerabilities.
- **CORS & Same-Origin Protections**: All mutating `/api/*` endpoints enforce same-origin verification and return `Cache-Control: private, no-store`.

---

## Roadmap

- [x] **Universal Study Library**: Multi-format ingestion (PDF, DOCX, Images, Notes).
- [x] **Active-Recall Flashcards**: AI generation with LaTeX math and mastery markers.
- [x] **Source-Grounded Practice Quizzes**: Deterministic grading with citation back-links.
- [x] **Source-Linked Notebooks**: AI chat tethered to source passages with zero fabrication.
- [x] **Deterministic Study Planner**: 15-minute grid scheduler with automatic conflict resolution.
- [x] **Tamper-Proof Focus Timer**: Server-persisted stopwatch immune to tab refreshes.
- [x] **Creation-of-Adam ASCII Hands Hero**: Dynamic canvas dot-matrix animation in Studium purple.
- [ ] **Spaced Repetition Review Queue**: Automated SuperMemo SM-2 daily card review queues.
- [ ] **Weak-Topic Practice Generator**: Targeted diagnostic quizzes targeting concepts with low scores.
- [ ] **Vector Retrieval (pgvector)**: Semantic chunk search for large multi-volume textbooks (1,000+ pages).
- [ ] **Explain-Back Oral Revision**: AI listening mode comparing student spoken explanations against syllabus rubrics.

---

## License

This project is open-source. See the repository headers and legal policies in `src/app/pages/Legal.tsx` for usage details.

<div align="center">
<sub>Crafted with care for students who care about understanding things deeply.</sub>
</div>
