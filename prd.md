# STUDIUM
## Product Requirements Document (PRD)
**Product:** Studium — AI Study Planner  
**Version:** 1.0 — Full MVP Specification  
**Platform:** Responsive Web Application  
**Product Type:** AI-powered Productivity / EdTech SaaS  
**Development Approach:** AI-assisted Full-Stack Development  
**Objective:** Build a fully functional, production-quality portfolio project.

---

# 1. Product Overview

## 1.1 Product Description

Studium is an AI-powered study planning and productivity platform designed to help students organize their academic workload, generate personalized study schedules, manage deadlines, and measure their learning progress.

Instead of manually figuring out what to study each day, users provide Studium with information about their subjects, academic goals, examination dates, available study time, and preferences.

Studium converts this information into a realistic study schedule and continuously adjusts the schedule as users complete tasks, miss sessions, or change their priorities.

The platform combines the functionality of a study planner, calendar, task manager, focus timer, and academic productivity dashboard into one unified experience.

## 1.2 Product Vision

**Make studying organized, adaptive, and less overwhelming through intelligent planning.**

Studium should feel like a premium productivity application designed specifically for students.

It should emphasize:

- Simplicity and clarity
- Intelligent automation
- Personalization
- Beautiful, modern UI/UX
- Meaningful progress tracking
- Realistic scheduling
- Minimal friction between planning and studying

## 1.3 Problem Statement

Students frequently struggle with:

1. Deciding what to study and when.
2. Managing multiple subjects simultaneously.
3. Allocating sufficient time before examinations.
4. Creating realistic schedules.
5. Keeping track of assignments and deadlines.
6. Adjusting study plans after missing sessions.
7. Maintaining consistency.
8. Understanding how much time they actually spend studying.

Conventional calendar applications and to-do list tools require students to manually organize their workloads.

Studium addresses this problem by combining intelligent study planning with a streamlined execution and tracking experience.

## 1.4 Core Value Proposition

**"Plan smarter. Study better."**

Studium helps students answer three essential questions:

- What should I study today?
- Am I on track to meet my academic goals?
- How should my study plan change based on my progress?

## 1.5 Target Users

### Primary Audience

- High school students
- University students
- Students preparing for competitive examinations
- Self-directed learners studying multiple subjects

### Secondary Audience

- Students managing academic projects
- Learners preparing for certifications
- Individuals pursuing structured personal learning goals

## 1.6 Product Positioning

Studium should be positioned as an intelligent study workspace, not simply an AI chatbot or conventional task management application.

Its competitive advantage should be its integration of planning, execution, and adaptive scheduling into one cohesive workflow.

---

# 2. MVP Objectives and Boundaries

## 2.1 Primary Objectives

The MVP must enable users to:

1. Create an account and securely sign in.
2. Complete personalized study onboarding.
3. Create and manage academic subjects.
4. Add topics, tasks, examinations, and deadlines.
5. Configure weekly study availability.
6. Generate personalized study schedules using AI-assisted planning.
7. Review, modify, and accept generated schedules.
8. View upcoming study sessions on a calendar.
9. Start and track focused study sessions.
10. Complete, skip, and reschedule sessions.
11. Monitor their learning progress through analytics.
12. Regenerate schedules when their circumstances change.
13. Update preferences and account settings.

Every core feature must persist real data and work after refreshing the browser.

## 2.2 Essential MVP Features

| Feature | Priority |
|---|---|
| Authentication | P0 |
| Guided onboarding | P0 |
| Subject management | P0 |
| Topic and task management | P0 |
| Exam and deadline tracking | P0 |
| Weekly availability configuration | P0 |
| AI-assisted schedule generation | P0 |
| Calendar and schedule management | P0 |
| Manual rescheduling | P0 |
| Focus timer | P0 |
| Session completion tracking | P0 |
| Dashboard | P0 |
| Progress analytics | P0 |
| Adaptive replanning | P0 |
| Account and study settings | P0 |
| Responsive UI | P0 |
| Dark and light themes | P1 |
| AI schedule explanations | P1 |
| Demo experience | P1 |

P0 features are mandatory for an acceptable MVP. P1 features should be included when the core experience is stable.

## 2.3 Explicitly Out of Scope

The initial MVP should not include:

- AI-generated flashcards
- AI tutoring chatbots
- Automatic note transcription
- Document or PDF analysis
- Multiplayer study rooms
- Social feeds
- Public profiles
- Leaderboards
- Mobile native applications
- Subscription billing
- Payment gateways
- Integration with third-party calendars
- Real-time collaborative studying
- Push notifications
- Complex learning management systems

These features may be considered for future versions.

**Important:** Do not sacrifice the quality of essential functionality to introduce additional features.

---

# 3. Technology Stack

## 3.1 Required Stack

| Layer | Technology |
|---|---|
| Application framework | Next.js App Router |
| Frontend | React |
| Programming language | TypeScript |
| Styling | Tailwind CSS v4 |
| Primary UI components | shadcn/ui |
| Additional UI components | HeroUI v3 |
| UI blocks and animation components | Watermelon UI |
| UI design patterns and components | Untitled UI React |
| React animations | Motion for React (Framer Motion) |
| Advanced animations | Anime.js |
| Icons | Lucide React |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Backend | Next.js Route Handlers and Server Actions |
| AI integration | OpenAI API |
| Forms | React Hook Form + Zod |
| Data visualization | Recharts or compatible established chart library |
| Calendar | FullCalendar React or another maintained React calendar library |
| Date handling | Luxon or a similarly timezone-aware library |
| Hosting | Vercel |
| Version control | Git + GitHub |
| Unit testing | Vitest |
| End-to-end testing | Playwright |

Use stable, compatible releases available during implementation. Verify installation instructions against official documentation.

Do not invent component exports, API methods, or package names.

## 3.2 AI Integration Strategy

Use OpenAI's API for AI-assisted study planning and recommendations.

All AI requests must be sent from the server.

The application must never expose an API key through frontend JavaScript.

The model should assist with:

- Interpreting academic priorities
- Breaking topics into manageable study tasks
- Estimating reasonable study durations
- Recommending subject allocations
- Providing human-readable schedule explanations
- Suggesting adjustments when a schedule cannot fit all tasks

Actual calendar slot allocation must be performed and validated by deterministic scheduling logic.

This ensures generated study schedules respect hard constraints rather than depending on potentially inconsistent model-generated times.

The AI model must be configurable through environment variables rather than hardcoded throughout the project.

---

# 4. UI/UX Architecture and Library Usage

## 4.1 Mandatory Instruction for the AI Coding Agent

**The development AI must prioritize existing, professionally designed UI libraries instead of generating UI components from scratch.**

The AI should behave as an application developer assembling a cohesive product from reliable, reusable components.

### Required Rules

1. Search the approved component libraries before implementing a UI element.
2. Prefer documented, reusable library components over manually recreating common UI patterns.
3. Use existing buttons, cards, inputs, modals, dialogs, menus, dropdowns, tooltips, tables, calendar controls, navigation elements, and feedback components.
4. Use existing dashboard layouts, application shells, and section patterns where appropriate.
5. Customize library components through supported styling APIs and theme tokens.
6. Do not blindly copy entire component libraries into the project.
7. Avoid implementing duplicate versions of the same UI element from different libraries.
8. Build custom components only when Studium requires application-specific behavior or no suitable library component exists.
9. Preserve keyboard accessibility, responsive layouts, and consistent visual styling.
10. Verify component documentation and licensing before using copied source code.

Using these libraries does not mean the entire interface must look like an unmodified library template.

The AI must compose existing components into a unique, cohesive Studium application.

## 4.2 Approved UI Libraries

### A. shadcn/ui — Primary Component Foundation

Website: https://ui.shadcn.com

Use shadcn/ui as the foundation for Studium's reusable component system.

Suggested components:

- Buttons
- Cards
- Input fields
- Textareas
- Checkboxes
- Select menus
- Dialogs
- Drawers / sheets
- Dropdown menus
- Tooltips
- Tabs
- Progress indicators
- Skeleton loaders
- Alerts
- Badges
- Date pickers
- Navigation elements
- Form controls

The AI should install real components using the official shadcn CLI and customize them through Studium's design tokens.

### B. Watermelon UI — Animated Components and Dashboard Blocks

Website: https://ui.watermelon.sh

Use Watermelon UI to source polished components, animated interactions, dashboard inspiration, and prebuilt UI blocks.

Suitable applications:

- Dashboard widgets
- Interactive cards
- Animated statistics
- Hover effects
- Expandable content
- Interesting onboarding patterns
- Marketing sections
- Empty states
- Premium interface details

Use compatible components with their intended dependencies and installation instructions.

Do not introduce excessive animation into productivity-focused screens.

### C. Untitled UI — Professional SaaS Patterns

Website: https://www.untitledui.com

React documentation: https://www.untitledui.com/react/docs/introduction

Use Untitled UI React for professional application patterns and components where they are available under the project's permitted license.

Suitable applications:

- Dashboard composition
- Sidebar design
- Settings layouts
- Forms
- Tables
- Navigation
- Page headers
- User menus
- Landing page sections

Use the available free/open-source components, or properly licensed premium resources.

Do not assume that paid templates are freely available.

### D. HeroUI — Selective Interactive Components

Website: https://heroui.com

Use HeroUI v3 selectively for polished interaction-heavy components where it adds real value.

Potential applications:

- Forms
- Select inputs
- Autocomplete
- Popovers
- Accordions
- Date selection
- Interactive menu controls

Do not create parallel shadcn/ui and HeroUI versions of the same component unnecessarily.

Use one consistent styling and theming system.

### E. Motion for React — Primary React Animation System

Website: https://motion.dev

Motion for React, previously known as Framer Motion, should handle:

- Page transitions
- Modal entrances
- Expanding and collapsing panels
- Card transitions
- Interactive hover effects
- State changes
- Completion feedback
- Subtle staggered entrances
- Layout transitions

Prefer the current documented `motion/react` package API.

Animations must remain functional under reduced-motion accessibility preferences.

### F. Anime.js — Advanced Motion

Website: https://animejs.com

Use Anime.js selectively for:

- Landing page hero animations
- SVG illustrations
- Decorative progress sequences
- Animated onboarding visualizations
- Custom motion sequences that are difficult to implement declaratively

Use documented Anime.js React integration and clean up animation instances correctly.

Do not simultaneously animate the same element or property with Anime.js and Motion.

## 4.3 Component Source Priority

Use the following selection hierarchy:

1. shadcn/ui for standard application controls.
2. Untitled UI for suitable free professional application patterns.
3. HeroUI for selected specialized controls.
4. Watermelon UI for selected animated components and blocks.
5. Motion for React for component-level animation.
6. Anime.js for advanced decorative motion.
7. Custom implementation only for Studium-specific functionality.

Avoid framework or dependency incompatibilities. If two implementations conflict, favor the simpler, more maintainable component.

---

# 5. Visual Design System

## 5.1 Design Direction

Studium should have a modern, minimal, slightly editorial SaaS aesthetic.

The visual direction should feel like a combination of:

- A sophisticated productivity application
- A modern student workspace
- A clean SaaS dashboard
- A calm, distraction-free learning environment

The design should feel approachable without looking childish.

Avoid generic AI-generated dashboard styling.

### Design Characteristics

- Generous whitespace
- Clear visual hierarchy
- Consistent spacing
- Rounded but restrained corners
- Subtle shadows
- Elegant typography
- Neutral surfaces
- Selective accent colors
- Carefully balanced card layouts
- Consistent iconography
- Responsive grids
- Smooth but subtle motion

## 5.2 Color Palette

Proposed initial brand palette:

| Token | Light Theme |
|---|---|
| Primary | #635BFF |
| Primary hover | #5147E5 |
| Main background | #FAFAFC |
| Surface | #FFFFFF |
| Main text | #171923 |
| Secondary text | #737887 |
| Border | #E8EAF0 |
| Success | #20A879 |
| Warning | #E2A23A |
| Destructive | #DC5263 |

Use a dark theme with carefully selected dark surfaces and preserved contrast.

The purple primary accent should represent Studium's brand identity rather than dominating every component.

Subject colors must be visually distinguishable and not be the sole means of conveying information.

## 5.3 Typography

Preferred font families:

- Inter or Geist for interface text
- Optional expressive heading font for the marketing website

Typography hierarchy:

- Marketing headings: 48–64 px on desktop
- Application page headings: 28–36 px
- Section headings: 18–24 px
- Body text: 14–16 px
- Supporting metadata: 12–14 px

Maintain readable line heights and accessible contrast.

## 5.4 Spacing and Shape

Use a consistent spacing scale based on 4 px increments.

Suggested corner radius:

- Small controls: 8 px
- Buttons and inputs: 10 px
- Cards: 14–16 px
- Large dialogs: 18–20 px

Avoid excessive blur, glassmorphism, glowing borders, or heavy shadows throughout the app.

## 5.5 Responsive Breakpoints

### Desktop: 1024 px and above

- Persistent sidebar
- Main content area
- Multi-column dashboards
- Calendar week view
- Optional secondary contextual panel

### Tablet: 768–1023 px

- Collapsible sidebar
- Reduced dashboard columns
- Compact calendar layout
- Responsive modals

### Mobile: below 768 px

- Compact header
- Bottom navigation for primary destinations
- Drawer for secondary destinations
- Stacked cards
- Day-oriented planner view
- Full-width forms
- Touch-friendly controls

Mobile must be a functional application, not merely a compressed desktop layout.

## 5.6 Motion Guidelines

- Hover interactions: approximately 120–180 ms
- Panel transitions: approximately 180–280 ms
- Page transitions: approximately 200–350 ms
- Respect `prefers-reduced-motion`
- Avoid unnecessary animation during focus sessions
- Never delay essential actions solely to play an animation

---

# 6. Information Architecture

## 6.1 Public Routes

| Route | Purpose |
|---|---|
| `/` | Marketing landing page |
| `/login` | Sign in |
| `/signup` | Register |
| `/forgot-password` | Password recovery |
| `/auth/callback` | Authentication callback |

## 6.2 Application Routes

| Route | Purpose |
|---|---|
| `/onboarding` | Initial study setup |
| `/dashboard` | Main overview |
| `/planner` | Schedule and calendar |
| `/subjects` | Subject listing |
| `/subjects/[id]` | Subject details |
| `/tasks` | Task manager |
| `/focus` | Focus timer |
| `/analytics` | Study performance |
| `/settings` | Profile and preferences |

All application routes except onboarding must require authentication and a completed onboarding state.

Unfinished onboarding should redirect users to the appropriate onboarding step.

---

# 7. Application Navigation

## 7.1 Desktop Sidebar

The application sidebar must contain:

**Primary Navigation**

- Dashboard
- Planner
- Subjects
- Tasks
- Focus
- Analytics

**Secondary Navigation**

- Settings

**Bottom Sidebar Area**

- Account avatar
- User display name
- Account dropdown
- Sign out

The active route should be clearly highlighted.

Use Lucide icons consistently.

## 7.2 Application Header

Each page header should contain:

- Page title
- Short contextual description where appropriate
- Relevant primary page action
- User-accessible theme toggle or preference control

On the dashboard, display a personalized greeting.

Do not implement decorative buttons that have no action.

---

# 8. Landing Page Requirements

## 8.1 Purpose

The landing page should communicate Studium's value and encourage visitors to create an account.

It should look like a real early-stage SaaS product website.

## 8.2 Hero Section

Headline:

**Your studies, intelligently planned.**

Subheadline:

"Turn your subjects, deadlines, and goals into a personalized study plan that adapts to your progress."

Primary CTA: **Start Planning for Free**

Secondary CTA: **Explore Features**

The primary CTA routes to registration.

The secondary CTA scrolls to the feature section.

Visual content should include a polished, responsive product dashboard preview.

Use actual Studium UI patterns rather than unrelated stock photography.

## 8.3 Feature Sections

Highlight:

1. AI-powered study planning
2. Adaptive scheduling
3. Academic task and deadline management
4. Focus sessions
5. Progress analytics

## 8.4 How It Works

Three-step explanation:

**Step 1:** Add your subjects and academic goals.

**Step 2:** Tell Studium when you are available.

**Step 3:** Generate a realistic study plan and start studying.

## 8.5 Final CTA

Headline:

**Less planning. More learning.**

CTA: **Create Your Study Plan**

## 8.6 Footer

Include:

- Studium logo
- Short product description
- Product navigation
- GitHub link, when provided
- Copyright text
- Privacy and legal links when implemented

Do not invent testimonials, ratings, institutional partnerships, or customer statistics.

---

# 9. Authentication

## 9.1 Required Capabilities

Implement authentication with Supabase Auth.

Support:

- Email/password registration
- Email/password login
- Password reset
- Authenticated sessions
- Sign out
- Google OAuth when configured

## 9.2 Registration

Fields:

- Display name
- Email address
- Password
- Confirm password

Requirements:

- Validate all inputs.
- Display helpful inline validation messages.
- Handle existing email addresses securely.
- Show email confirmation instructions where required.
- Do not create duplicate profiles.
- Redirect authenticated users appropriately.

## 9.3 Login

Fields:

- Email
- Password

Interactions:

- Show/hide password
- Remember session through supported secure authentication handling
- Forgot password
- Sign up link
- Google sign-in when configured

## 9.4 Route Protection

- Unauthenticated visitors cannot access private application pages.
- Authenticated users with incomplete onboarding are redirected to onboarding.
- Users cannot read or modify another user's data.
- Protected server mutations must independently verify authentication and authorization.

---

# 10. Onboarding Experience

## 10.1 Objective

Collect the minimum information necessary to create a personalized study schedule.

Onboarding should be a guided, multi-step experience with a visible progress indicator.

Users must be able to navigate backward without losing information.

Persist progress so the process can resume after a refresh.

## 10.2 Step 1 — Welcome and Learning Profile

Display a welcoming introduction.

Collect:

- Preferred display name
- Study goal or academic context

Academic context options:

- School
- University
- Competitive examination
- Self-learning
- Other

Optional free-text learning goal.

Do not collect unnecessary personal information such as full legal name, school identity, date of birth, or precise location.

## 10.3 Step 2 — Subjects

Allow users to add subjects.

Each subject requires:

- Subject name
- Subject color
- Priority: low, medium, or high
- Self-reported difficulty: 1–5

Optional:

- Short description
- Weekly target study hours

Users can add multiple subjects.

A minimum of one subject is required before schedule generation.

## 10.4 Step 3 — Academic Deadlines

Allow users to add upcoming examinations or important deadlines.

Fields:

- Assessment title
- Associated subject
- Due date
- Optional examination start time
- Priority
- Optional notes

Users may skip this step.

Studium must still work for users who do not have examination dates.

## 10.5 Step 4 — Weekly Availability

Display a weekly availability editor.

Users specify:

- Available days
- Start and end times
- Multiple study windows per day
- Preferred study session length
- Preferred break duration
- Maximum daily study time

Example:

Monday:
- 5:00 PM – 7:00 PM
- 8:00 PM – 9:00 PM

Tuesday:
- 6:00 PM – 8:00 PM

Users must be able to add or remove availability windows.

Do not require availability every day.

Detect and prevent invalid or overlapping availability entries.

Store the user's timezone.

## 10.6 Step 5 — Planning Preferences

Collect:

- Primary goal: examination preparation, balanced learning, task completion, or general consistency
- Preferred session duration
- Short-break duration
- Maximum study minutes per day
- Planning horizon, default 7 days
- Whether to prioritize urgent deadlines or balanced subject coverage

Provide reasonable default values.

## 10.7 Step 6 — Initial Plan

Display a summary of the supplied information.

CTA: **Generate My First Study Plan**

The system creates a proposed schedule.

The user must review and accept the proposed plan before it becomes active.

If the generated plan cannot fit all work into the available time, explain the limitation.

---

# 11. Dashboard

## 11.1 Primary Purpose

The dashboard should immediately answer:

**What should I do today, and how am I progressing?**

## 11.2 Page Layout

Recommended desktop arrangement:

**Top section**
- Personalized greeting
- Current date
- Primary action: Start Studying or Generate Plan

**Statistics row**
- Planned study time today
- Completed study time today
- Upcoming tasks
- Weekly completion rate

**Main section**
- Today's study schedule
- Weekly progress visualization

**Secondary section**
- Upcoming deadlines
- Subject progress
- Quick actions

## 11.3 Today's Schedule

Display study session cards.

Each card must include:

- Subject name
- Subject color
- Topic or task title
- Scheduled time
- Planned duration
- Session status
- Start session action
- Reschedule action

Completed sessions should display a clear completed state.

Missed or skipped sessions should display their actual status.

## 11.4 Statistics

Statistics must be calculated from persisted study data.

Examples:

- "2h 15m studied today"
- "3 sessions remaining"
- "75% of planned sessions completed this week"

Never display invented metrics as actual user statistics.

## 11.5 Quick Actions

Provide functional shortcuts:

- Add Task
- Add Subject
- Generate Plan
- Start Focus Session

## 11.6 Empty Dashboard

For first-time users without a plan:

Show a useful empty state with a clear CTA to set up subjects and generate a schedule.

Do not show fabricated historical progress.

---

# 12. Subject Management

## 12.1 Subjects Page

Display a responsive collection of subject cards.

Each card contains:

- Subject name
- Subject color indicator
- Priority
- Difficulty level
- Weekly target hours, if configured
- Completed study minutes this week
- Open task count
- Upcoming examination indicator

Interactions:

- Create subject
- Edit subject
- Delete subject with confirmation
- Open subject details

## 12.2 Subject Detail Page

Display:

- Subject overview
- Topic listing
- Associated tasks
- Upcoming assessments
- Study time statistics
- Subject-specific schedule entries

## 12.3 Topic Management

Each subject can contain multiple topics.

Fields:

- Topic name
- Optional description
- Estimated study minutes
- Status: not started, in progress, completed

Users can:

- Add topics
- Edit topics
- Mark topics completed
- Delete topics

## 12.4 Subject Deletion

Deletion must show a confirmation explaining the effect on linked tasks, assessments, and planned sessions.

Use a safe transaction or explicit deletion strategy.

Do not leave invalid references.

---

# 13. Task Management

## 13.1 Tasks Page

The task manager should offer a list/table view with filtering and grouping.

Filters:

- All tasks
- Today
- Upcoming
- Overdue
- Completed

Additional filters:

- Subject
- Priority
- Status

Sorting:

- Due date
- Priority
- Creation date

## 13.2 Task Fields

Required:

- Title
- Subject
- Estimated duration

Optional:

- Description
- Topic
- Due date
- Priority

System-maintained:

- Status
- Scheduled minutes
- Completed minutes
- Creation timestamp
- Last updated timestamp

## 13.3 Task Actions

Users can:

- Create task
- Edit task
- Delete task
- Change priority
- Mark complete
- Reopen
- Add to plan
- View linked study sessions

## 13.4 Task Status

Supported statuses:

- To Do
- In Progress
- Completed
- Archived

When a task is marked completed, future linked study sessions must be removed or flagged for replanning after user confirmation.

Do not silently duplicate planned work.

## 13.5 Validation

- Empty titles are invalid.
- Estimated duration must be positive.
- Due dates must be valid.
- Tasks cannot belong to a subject owned by another user.
- Task updates must immediately appear throughout the application.

---

# 14. AI Study Plan Generator

## 14.1 Purpose

This is Studium's primary differentiating feature.

The planner should turn academic data into a realistic, personalized, and actionable schedule.

## 14.2 Inputs

The system must consider:

- User timezone
- Selected date range
- Subjects
- Subject priorities
- Subject difficulty
- Weekly study targets
- Topics
- Open tasks
- Estimated task durations
- Task deadlines
- Examinations
- Availability windows
- Maximum daily study time
- Preferred session length
- Break preferences
- Existing completed sessions
- Existing manually locked sessions
- Relevant user preferences

## 14.3 Generation Interface

Create a planning panel or dialog.

Controls:

- Start date
- Planning horizon
- Subjects to include
- Planning emphasis
- Generate button

Suggested planning emphasis options:

- Balanced
- Deadline-focused
- Difficult subjects first

Display an explanatory note describing what the plan will consider.

## 14.4 Planning Process

### Stage 1 — Gather Data

Fetch all applicable user data from the database.

Normalize timestamps to the user's timezone.

### Stage 2 — Determine Available Study Capacity

Calculate available study minutes for each date.

Subtract existing commitments, preserved sessions, and blocked periods.

Apply daily study limits.

### Stage 3 — AI Recommendation Layer

Send a compact, validated representation of relevant study data to the AI.

Request:

- Task priority recommendations
- Optional task breakdowns
- Reasonable workload estimates
- Subject allocation suggestions
- Concise plan explanation

Require structured JSON output.

### Stage 4 — Deterministic Scheduling

Use a local/server scheduling algorithm to allocate work into valid slots.

### Stage 5 — Validation

Check:

- No overlapping sessions
- No sessions outside availability
- No sessions before the current time
- No past-deadline allocation for deadline-bound work
- No violation of maximum daily limits
- No duplicate task allocation
- No deletion of completed or manually locked sessions
- Total planned minutes do not exceed available time
- Minimum and maximum session lengths are respected except valid final short fragments
- User data remains isolated

### Stage 6 — Proposed Plan

Return a proposed schedule containing:

- Study sessions
- Subject allocations
- Dates and times
- Durations
- Relevant task links
- Short reasoning
- Unscheduled workload warnings

### Stage 7 — User Review

Show the complete proposal before committing it.

The user can:

- Accept the plan
- Cancel
- Modify individual sessions
- Regenerate

The accepted plan is saved to the database.

## 14.5 Scheduling Algorithm

Use 15-minute scheduling granularity.

Default rules:

- Planning horizon: 7 days
- Preferred session length: 50 minutes
- Minimum useful study block: 25 minutes
- Maximum session length: 90 minutes
- Default break: 10 minutes
- User availability takes precedence over all recommendations
- Respect maximum daily study limits
- Breaks consume available calendar capacity but do not count as study time
- Prefer finishing urgent tasks before their deadlines
- Maintain reasonable subject distribution when possible
- Spread work across dates instead of unnecessarily concentrating it

### Priority Calculation

Use a configurable heuristic.

Example inputs:

- Time until deadline
- User-assigned priority
- Subject difficulty
- Remaining estimated workload
- Subject target shortfall

A possible weighted score:

`Priority Score = 0.40 × Urgency + 0.25 × User Priority + 0.20 × Subject Difficulty + 0.15 × Target Shortfall`

Normalize each factor to a common scale before calculating.

This formula is a starting heuristic, not an academically validated learning model.

AI may recommend changes to priority but cannot override hard scheduling constraints.

## 14.6 Required Failure Handling

If available study time is insufficient:

Display:

"Your available study time isn't enough to fit everything into this plan."

Show:

- Total requested minutes
- Total available minutes
- Unscheduled minutes
- Affected tasks
- Recommended adjustments

Possible suggestions:

- Extend the planning period
- Increase availability
- Reduce lower-priority work
- Change task estimates

Never silently discard important tasks.

## 14.7 Plan Versioning

Plan generation must be non-destructive.

- Save each accepted generation as a plan version.
- Never overwrite completed study history.
- Preserve manually locked sessions during regeneration.
- Show the proposed changes before applying them.
- Maintain only one active plan version for a given planning context.
- Avoid duplicate sessions from repeated submissions.

---

# 15. Study Planner and Calendar

## 15.1 Main Planner Interface

The planner should display the user's accepted schedule.

Required views:

- Day
- Week

The week view should be the desktop default.

The day view should be the mobile default.

## 15.2 Calendar Events

Each event displays:

- Subject
- Study task or topic
- Start time
- End time
- Status
- Subject color

## 15.3 Calendar Interactions

Users can:

- Navigate dates
- Switch views
- Select sessions
- Edit session details
- Reschedule sessions
- Skip sessions
- Mark sessions completed
- Start focus mode
- Create a manual study session

Use a maintained calendar library rather than recreating complex calendar interactions unnecessarily.

## 15.4 Manual Rescheduling

When modifying a session:

- Display a date/time editor.
- Check new availability.
- Prevent overlaps.
- Explain any scheduling conflicts.
- Let the user choose another valid time.
- Save the change.
- Mark manually moved sessions as locked for future replanning unless the user unlocks them.

## 15.5 Calendar Empty States

If no sessions exist:

Show:

"No study sessions scheduled."

Provide a CTA to generate a plan or add a manual session.

---

# 16. Focus Mode

## 16.1 Purpose

Help students execute their study plan without distractions.

## 16.2 Focus Page

The interface must include:

- Large countdown timer
- Current subject
- Current task
- Session duration
- Start button
- Pause button
- Resume button
- End session button
- Optional progress ring

The page should be visually minimal.

## 16.3 Focus Timer

Provide two ways to start:

1. Start from a scheduled study session.
2. Start a standalone focus session.

Default focus duration: 25 minutes.

Allow selection from:

- 25 minutes
- 50 minutes
- Custom duration

Custom duration must respect sensible limits.

## 16.4 Timer Behavior

- Start begins countdown.
- Pause stops elapsed-time accumulation.
- Resume continues from the remaining duration.
- The timer must remain accurate when the tab is backgrounded.
- Browser refresh should recover an active session from persisted timing state.
- When the timer reaches zero, prompt the user to confirm completion.
- Ending early should allow partial progress to be recorded.

The timer must use reliable timestamps and accumulated pause intervals, not merely decrement an in-memory counter each second.

## 16.5 Session Completion

On completion, display:

- Subject
- Planned duration
- Actual focused time
- Completion status

Actions:

- Mark Completed
- Mark Partially Completed
- End Without Completing

Only confirmed progress should update analytics.

## 16.6 Break Mode

If configured, provide a break timer after a completed focus interval.

Break minutes must not be counted as study minutes.

Avoid forcing users into another session automatically.

---

# 17. Adaptive Replanning

## 17.1 Purpose

Allow Studium to adjust study schedules when the original plan is no longer realistic.

## 17.2 Replanning Triggers

Support replanning when:

- A session is skipped.
- A planned session becomes overdue.
- A new examination is added.
- A task deadline changes.
- Availability is modified.
- Task estimates change.
- The user explicitly requests regeneration.

For the MVP, automatic detection may show a suggestion to replan rather than silently changing the schedule.

## 17.3 Replanning Rules

- Preserve completed study history.
- Preserve manually locked sessions.
- Recalculate remaining work.
- Respect new availability.
- Avoid duplicate tasks.
- Use the current planning horizon.
- Preserve user changes unless explicitly approved otherwise.

## 17.4 Replanning Preview

Present a summary such as:

"Studium found 3 sessions that need attention."

Show proposed changes:

- Moved sessions
- Added sessions
- Removed obsolete sessions
- Unscheduled remaining work

CTA: **Apply Updated Plan**

The user's confirmation is required.

---

# 18. Analytics Dashboard

## 18.1 Objective

Give students a realistic picture of their study activity and plan adherence.

## 18.2 Required Metrics

### Total Study Time

Sum confirmed actual study minutes for the selected period.

### Planned vs Actual

Compare scheduled study duration against confirmed study duration.

### Session Completion Rate

`Completion Rate = Completed Scheduled Sessions / Eligible Scheduled Sessions × 100`

Define eligible sessions as scheduled sessions whose planned end time has passed, excluding sessions explicitly canceled before their start.

### Subject Distribution

Display actual study minutes grouped by subject.

### Weekly Study Activity

Show study minutes per day.

### Task Completion

Show completed and remaining tasks.

## 18.3 Visualizations

Use established chart libraries.

Required visualizations:

- Daily study minutes bar chart
- Planned vs actual chart
- Subject distribution chart
- Weekly progress indicators

## 18.4 Date Filters

Support:

- Last 7 days
- Last 30 days

## 18.5 Empty States

When a user has not completed any study sessions:

Display a helpful empty state.

Do not display fake historical activity.

## 18.6 Analytics Integrity

Actual study time must have a single authoritative calculation path.

Avoid double-counting time when multiple focus runs belong to one scheduled study session.

Historical analytics must not disappear when schedules are regenerated.

---

# 19. Settings

## 19.1 Profile

Fields:

- Display name
- Email address, subject to authentication requirements
- Timezone

## 19.2 Study Preferences

Controls:

- Preferred focus duration
- Preferred break duration
- Maximum daily study time
- Weekly availability
- Preferred planning style
- Default planning horizon

Changes should be saved to the database.

## 19.3 Appearance

Controls:

- Light theme
- Dark theme
- System theme

Persist the chosen preference.

## 19.4 Account

Include:

- Sign out
- Change/reset password
- Delete account with explicit confirmation

Account deletion must remove or appropriately anonymize user-owned study data.

Do not claim deletion is complete until the server successfully performs the operation.

---

# 20. AI Response Specification

## 20.1 Structured Responses

AI responses must use a strict, validated structure.

Suggested top-level output:

- `summary`: short explanation of the recommendation
- `task_recommendations`: ordered recommendation objects
- `subject_allocations`: suggested subject allocation objects
- `warnings`: list of identified issues
- `suggestions`: optional actionable improvements

Each task recommendation should contain:

- Existing task ID
- Recommended priority
- Estimated minutes
- Reasoning
- Optional suggested breakdown

The AI must use identifiers supplied by the server and must not invent database IDs.

## 20.2 AI System Instruction

Use the following conceptual system instruction:

"You are the study-planning intelligence behind Studium.

Your role is to help students distribute their study effort realistically based on subjects, tasks, deadlines, difficulty, availability, and study preferences.

Prioritize achievable schedules, balanced workloads, and urgent academic commitments.

Use only the supplied user data. Do not invent examinations, deadlines, existing tasks, or study history.

Return recommendations in the required structured format.

Do not treat your recommended times as confirmed calendar events. A separate scheduling engine determines valid time slots.

If the user's workload exceeds their available time, explicitly identify the shortfall.

Do not recommend schedules that violate user availability or reasonable study limits.

Provide concise, helpful explanations."

## 20.3 API Safety and Reliability

Implement:

- Server-side model invocation
- Request validation
- Structured output parsing
- User authentication
- Rate limiting
- Response size limits
- API timeout handling
- Error handling
- Reasonable usage limits
- Idempotency protection
- Logging without exposing sensitive credentials

Suggested initial AI generation allowance:

- 5 plan generations per user per day

The allowance should be configurable.

## 20.4 AI Failure Fallback

If the AI provider is unavailable:

- Explain that AI recommendations are temporarily unavailable.
- Continue supporting deterministic schedule generation.
- Never claim a fallback plan was AI-generated.
- Never display fake AI reasoning.
- Preserve all existing user data.

The app must remain useful without successful AI requests.

---

# 21. Database Architecture

Use Supabase PostgreSQL.

Every user-owned table must support robust row-level authorization.

Use UUID identifiers and appropriate foreign keys.

Store event timestamps in UTC and maintain the user's IANA timezone separately.

## 21.1 Core Tables

### `profiles`

| Column | Type |
|---|---|
| id | UUID, primary key, references auth.users |
| display_name | Text |
| academic_context | Text |
| learning_goal | Text, nullable |
| timezone | Text |
| onboarding_completed | Boolean |
| onboarding_step | Integer |
| created_at | Timestamptz |
| updated_at | Timestamptz |

### `study_preferences`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID, unique foreign key |
| preferred_session_minutes | Integer |
| break_minutes | Integer |
| max_daily_minutes | Integer |
| planning_horizon_days | Integer |
| planning_style | Text |
| theme | Text |
| updated_at | Timestamptz |

### `subjects`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| name | Text |
| description | Text, nullable |
| color | Text |
| priority | Text |
| difficulty | Integer |
| weekly_target_minutes | Integer, nullable |
| created_at | Timestamptz |
| updated_at | Timestamptz |

### `topics`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| subject_id | UUID |
| name | Text |
| description | Text, nullable |
| estimated_minutes | Integer, nullable |
| status | Text |
| created_at | Timestamptz |
| updated_at | Timestamptz |

### `tasks`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| subject_id | UUID |
| topic_id | UUID, nullable |
| title | Text |
| description | Text, nullable |
| priority | Text |
| status | Text |
| due_at | Timestamptz, nullable |
| estimated_minutes | Integer |
| completed_minutes | Integer, default 0 |
| created_at | Timestamptz |
| updated_at | Timestamptz |

### `assessments`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| subject_id | UUID |
| title | Text |
| description | Text, nullable |
| due_at | Timestamptz |
| priority | Text |
| created_at | Timestamptz |
| updated_at | Timestamptz |

### `availability_rules`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| weekday | Integer, 0–6 |
| start_local_time | Time |
| end_local_time | Time |
| created_at | Timestamptz |

Define a single weekday convention and use it consistently.

### `availability_overrides`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| local_date | Date |
| start_local_time | Time, nullable |
| end_local_time | Time, nullable |
| is_unavailable | Boolean |
| created_at | Timestamptz |

Allow date-specific changes to weekly availability without rewriting recurring rules.

### `study_plans`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| start_date | Date |
| end_date | Date |
| version | Integer |
| status | Text |
| generation_source | Text |
| explanation | Text, nullable |
| created_at | Timestamptz |
| accepted_at | Timestamptz, nullable |

Statuses: proposed, active, superseded, discarded.

### `study_sessions`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| plan_id | UUID, nullable |
| subject_id | UUID |
| task_id | UUID, nullable |
| title | Text |
| starts_at | Timestamptz |
| ends_at | Timestamptz |
| planned_minutes | Integer |
| actual_minutes | Integer, default 0 |
| status | Text |
| is_locked | Boolean |
| completed_at | Timestamptz, nullable |
| created_at | Timestamptz |
| updated_at | Timestamptz |

Statuses: planned, in_progress, completed, missed, skipped, canceled.

### `focus_runs`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| study_session_id | UUID, nullable |
| subject_id | UUID, nullable |
| started_at | Timestamptz |
| ended_at | Timestamptz, nullable |
| planned_seconds | Integer |
| accumulated_focus_seconds | Integer |
| last_resumed_at | Timestamptz, nullable |
| status | Text |
| created_at | Timestamptz |

Statuses: running, paused, completed, abandoned.

The server must reconcile focus run completion with study session actual minutes transactionally to prevent double counting.

### `ai_generation_usage`

| Column | Type |
|---|---|
| id | UUID, primary key |
| user_id | UUID |
| generation_type | Text |
| status | Text |
| request_id | Text, unique |
| created_at | Timestamptz |

Avoid storing full personal prompts and responses unnecessarily.

## 21.2 Database Requirements

- Use appropriate foreign keys.
- Add relevant indexes for user ID, dates, and foreign keys.
- Validate enum-like values.
- Prevent negative study durations.
- Enforce positive time estimates.
- Use composite ownership checks for cross-table relationships.
- Use database transactions for multi-record mutations.
- Enable RLS on all exposed user-owned tables.
- Create ownership policies for authenticated users.
- Secure any privileged operations separately.
- Use migrations for schema evolution.
- Never rely on client-side authorization alone.

## 21.3 Data Deletion and History

Define explicit relationship behavior:

- Deleting a subject must not leave orphaned records.
- Replanning must preserve completed session history.
- Task deletion must handle existing session references safely.
- Account deletion must clean up relevant user-owned records.

Use explicit service functions rather than allowing accidental cascading destruction of study history.

---

# 22. Backend API Specification

Use Next.js Route Handlers or Server Actions with consistent authorization and validation.

Suggested endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard` | Dashboard data |
| GET/POST | `/api/subjects` | List/create subjects |
| GET/PATCH/DELETE | `/api/subjects/[id]` | Subject operations |
| GET/POST | `/api/topics` | Topic management |
| PATCH/DELETE | `/api/topics/[id]` | Topic operations |
| GET/POST | `/api/tasks` | Task management |
| PATCH/DELETE | `/api/tasks/[id]` | Task operations |
| GET/POST | `/api/assessments` | Exam/deadline management |
| PATCH/DELETE | `/api/assessments/[id]` | Assessment operations |
| GET/PUT | `/api/availability` | Weekly availability |
| GET/PUT | `/api/availability/overrides` | Date exceptions |
| POST | `/api/plans/generate` | Generate proposal |
| POST | `/api/plans/[id]/accept` | Accept proposal |
| GET | `/api/plans/active` | Retrieve accepted plan |
| POST | `/api/plans/replan` | Generate revised proposal |
| GET/PATCH | `/api/sessions/[id]` | Session details/update |
| POST | `/api/sessions` | Create manual session |
| POST | `/api/sessions/[id]/complete` | Confirm completion |
| POST | `/api/focus/start` | Start focus run |
| POST | `/api/focus/[id]/pause` | Pause timer |
| POST | `/api/focus/[id]/resume` | Resume timer |
| POST | `/api/focus/[id]/finish` | End timer |
| GET | `/api/analytics` | Analytics data |
| GET/PATCH | `/api/preferences` | Preferences |
| DELETE | `/api/account` | Account deletion |

Endpoint grouping may differ if Server Actions are a better fit, but equivalent behavior must exist.

## 22.1 Common API Requirements

All endpoints must:

1. Verify authentication.
2. Validate request data.
3. Verify resource ownership.
4. Apply business rules.
5. Return consistent response objects.
6. Return appropriate HTTP status codes.
7. Handle errors without exposing server secrets.
8. Prevent unauthorized data access.

## 22.2 Response Format

Use a consistent shape.

Successful result:

- `success`
- `data`
- `message`, optional

Failed result:

- `success`
- `error.code`
- `error.message`
- `error.details`, optional

Do not leak database implementation details or API credentials to users.

---

# 23. Important User Flows

## Flow A — First-Time User

1. User visits landing page.
2. User clicks Start Planning for Free.
3. User registers.
4. User completes onboarding.
5. User adds subjects and availability.
6. User generates a plan.
7. User reviews the proposed schedule.
8. User accepts.
9. User reaches dashboard.
10. User sees today's next study session.

**Success Condition:** A new user can reach an actionable study plan without developer intervention.

## Flow B — Daily Study

1. User signs in.
2. User opens dashboard.
3. User sees today's sessions.
4. User selects a session.
5. User enters focus mode.
6. User completes study.
7. User confirms progress.
8. Dashboard and analytics update.

**Success Condition:** Study activity is persisted correctly and reflected throughout the app.

## Flow C — Missed Session

1. User misses a planned session.
2. Session is identified as missed or overdue.
3. Dashboard recommends replanning.
4. User selects Replan.
5. Studium proposes alternative slots.
6. User reviews the changes.
7. User accepts.
8. Calendar updates without losing history.

**Success Condition:** Incomplete work is rescheduled without duplicating completed work.

## Flow D — New Exam

1. User adds an examination.
2. User provides date and subject.
3. Studium identifies the new deadline.
4. User requests an updated plan.
5. AI-assisted prioritization considers the examination.
6. Scheduler produces a valid new proposal.
7. User accepts.

**Success Condition:** The examination meaningfully influences the schedule while respecting availability.

## Flow E — Manual Editing

1. User opens Planner.
2. User selects a study session.
3. User changes the scheduled time.
4. System checks for conflicts.
5. User saves.
6. Calendar updates.
7. The session is preserved during subsequent replanning unless unlocked.

**Success Condition:** User edits are respected.

---

# 24. Functional States and Error Handling

Every major interface must support appropriate:

- Loading state
- Success state
- Empty state
- Validation error
- Server error
- Authorization error
- Network failure
- Retry action

Examples:

### Plan Generation Loading

Display:

"Creating your study plan…"

Use a polished progress/loading state.

Do not show fabricated completion percentages.

### No Subjects

Display:

"Your study workspace starts with a subject."

CTA: Add Subject.

### No Upcoming Tasks

Display:

"You're all caught up."

CTA: Add Task.

### AI Unavailable

Display:

"AI suggestions are temporarily unavailable. You can still create a schedule using your existing tasks and availability."

### Scheduling Conflict

Display:

"This time overlaps with another study session."

Offer valid alternative times where possible.

### Save Failure

Display a clear error and preserve unsaved form data for retry.

Avoid nonfunctional placeholder UI.

---

# 25. Performance and Quality Requirements

## 25.1 Performance Targets

Targets for production deployment:

- Fast initial page render on normal broadband
- Responsive interactions on ordinary laptops and mobile devices
- Smooth common UI animations
- No avoidable layout shifts
- Lazy-load expensive charts and calendar features where appropriate
- Show immediate feedback for mutations
- Paginate or limit large datasets

Aim for strong Lighthouse scores under representative conditions, without treating a synthetic score as proof of overall usability.

## 25.2 Accessibility

Required:

- Semantic HTML
- Keyboard-accessible navigation
- Visible focus indicators
- Accessible forms and labels
- Dialog focus management
- Sufficient color contrast
- Reduced-motion support
- Screen-reader-friendly status messages
- Touch-friendly mobile controls

Target WCAG 2.2 AA for applicable interface elements.

## 25.3 Security

- Keep secrets server-side.
- Use secure authentication.
- Enforce database RLS.
- Validate user input.
- Sanitize or safely render user-created content.
- Prevent unauthorized object access.
- Rate-limit expensive endpoints.
- Prevent duplicate plan generation.
- Handle API errors safely.
- Do not log sensitive authentication credentials.
- Protect account deletion.
- Never trust AI-generated content as executable instructions or database commands.

## 25.4 Privacy

Collect only necessary academic information.

Do not require detailed personal profiles to generate useful plans.

Avoid unnecessary third-party tracking.

Clearly distinguish user data from AI-generated recommendations.

---

# 26. Acceptance Criteria

The MVP is only considered complete when the following are true.

## Authentication

- Users can register and sign in.
- Sessions persist correctly.
- Private routes are protected.
- Password recovery works when configured.
- Users cannot access one another's data.

## Onboarding

- All steps are functional.
- Subjects and availability are saved.
- Progress survives refresh.
- Completed onboarding leads to an initial plan.

## Subjects and Tasks

- CRUD operations work.
- Changes persist.
- Related pages update correctly.
- Invalid relationships are prevented.

## AI Planning

- The AI is actually invoked using a configured server-side API.
- Structured output is validated.
- The deterministic scheduler enforces constraints.
- The system detects insufficient availability.
- Proposed plans can be reviewed.
- Plans can be accepted and persisted.
- Repeated generation does not create duplicates.
- Provider failure is handled gracefully.

## Calendar

- Day and week views work.
- Sessions display correctly.
- Users can reschedule sessions.
- Conflicts are prevented.
- Timezone handling is correct.

## Focus Mode

- Timer starts, pauses, resumes, and finishes.
- Active timer state survives refresh.
- Completion is confirmed.
- Actual study time is persisted.
- Break time is excluded from analytics.

## Analytics

- Statistics use real data.
- Charts update after completed sessions.
- Results remain accurate after replanning.
- No study minutes are double-counted.

## UI/UX

- Screens are consistent.
- Existing UI libraries are used.
- All buttons and navigation are functional.
- Mobile and desktop layouts work.
- Loading, empty, and error states exist.
- Light/dark themes work if included.

## Deployment

- The application builds successfully.
- Database migrations are available.
- Environment variables are documented.
- The deployed app connects to real backend services.
- Critical user flows have been tested.

---

# 27. Testing Strategy

## 27.1 Unit Tests

Test:

- Priority calculation
- Availability calculation
- Date/time conversion
- Session allocation
- Deadline handling
- Conflict detection
- Workload overflow
- Focus timer duration calculation
- Analytics aggregation
- Task completion rules

## 27.2 Integration Tests

Test:

- Subject and task CRUD
- Onboarding persistence
- Schedule proposal generation
- Plan acceptance
- Manual rescheduling
- Replanning
- Focus completion persistence
- User authorization

## 27.3 End-to-End Tests

Use Playwright for critical user journeys:

1. Register and complete onboarding.
2. Create a subject and task.
3. Generate and accept a schedule.
4. Modify a scheduled session.
5. Complete a focus session.
6. Verify analytics update.
7. Replan after skipping a session.
8. Sign out and sign in.
9. Verify persisted data.

## 27.4 Edge Cases

Include tests for:

- Zero availability
- No tasks
- No examination dates
- More work than available time
- Multiple overlapping availability windows
- Examination deadline occurring today
- Very short remaining tasks
- Different user timezones
- Daylight saving time changes
- Browser refresh during focus mode
- Network interruption during plan generation
- Duplicate API requests
- Account ownership violations
- Deleted subjects referenced by sessions
- AI output failing validation

---

# 28. Demo Data for Development

Provide development-only sample data for testing.

Example subject set:

| Subject | Priority | Difficulty |
|---|---|---|
| Mathematics | High | 4/5 |
| Physics | High | 4/5 |
| Chemistry | Medium | 3/5 |

Example tasks:

- Mathematics — Practice calculus problems — 90 minutes
- Physics — Revise Newton's laws — 60 minutes
- Chemistry — Review chemical bonding — 45 minutes
- Mathematics — Complete algebra worksheet — 50 minutes
- Physics — Prepare for chapter test — 120 minutes

Example availability:

- Monday–Friday: 5 PM–7 PM
- Saturday: 10 AM–1 PM
- Sunday: Unavailable

Use future-relative dates for sample examinations so demo data does not immediately become stale.

Development seed data must be clearly separated from real user accounts.

Do not insert demo data into every newly created account.

---

# 29. Suggested Project Structure

Use a feature-oriented Next.js project structure.

Suggested directories:

- `src/app` — Routes, layouts, server entry points
- `src/app/api` — API endpoints
- `src/components/ui` — Installed reusable UI components
- `src/components/layout` — Sidebar, header, application shell
- `src/components/dashboard` — Dashboard-specific components
- `src/components/planner` — Calendar and planning components
- `src/components/subjects` — Subject components
- `src/components/tasks` — Task components
- `src/components/focus` — Focus timer components
- `src/components/analytics` — Charts and analytics components
- `src/components/marketing` — Landing page sections
- `src/features` — Feature-specific business logic
- `src/lib/supabase` — Database/authentication clients
- `src/lib/ai` — AI integration and schemas
- `src/lib/scheduling` — Deterministic scheduling engine
- `src/lib/validation` — Zod schemas
- `src/lib/dates` — Date/time utilities
- `src/hooks` — Reusable React hooks
- `src/types` — Shared TypeScript types
- `supabase/migrations` — SQL migrations
- `tests` — Unit and integration tests
- `e2e` — Playwright tests

Avoid placing all business logic directly inside page components.

Separate data access, validation, scheduling logic, and presentation.

---

# 30. Implementation Phases

## Phase 1 — Project Foundation

Deliverables:

- Next.js setup
- TypeScript
- Tailwind CSS
- shadcn/ui configuration
- Design tokens
- Component system
- Supabase integration
- Authentication
- Protected layouts
- Responsive sidebar and header

**Completion condition:** Users can register, sign in, and access a functional application shell.

## Phase 2 — Onboarding and Academic Data

Deliverables:

- Onboarding flow
- Profile storage
- Subject management
- Topic management
- Task management
- Assessment management
- Availability editor
- Study preferences

**Completion condition:** A user can create a complete study profile and persist all relevant data.

## Phase 3 — AI Planning Engine

Deliverables:

- AI integration
- Structured output schemas
- Priority scoring
- Deterministic scheduler
- Conflict validation
- Plan proposal interface
- Plan persistence
- Plan versioning

**Completion condition:** Users can reliably generate and accept valid schedules.

## Phase 4 — Planner and Focus Mode

Deliverables:

- Day/week calendar
- Session details
- Manual rescheduling
- Session completion
- Focus timer
- Session persistence
- Adaptive replanning

**Completion condition:** Users can follow and modify their schedules while recording study activity.

## Phase 5 — Dashboard and Analytics

Deliverables:

- Dashboard metrics
- Today's schedule
- Upcoming deadlines
- Progress visualizations
- Subject analytics
- Analytics filters

**Completion condition:** Users can understand their schedule and actual study performance.

## Phase 6 — Landing Page and Visual Polish

Deliverables:

- Marketing homepage
- Responsive product visuals
- Watermelon UI component integration where suitable
- Untitled UI patterns where suitable
- Selective HeroUI integration
- Motion animations
- Anime.js decorative interactions
- Dark/light theme
- Empty and loading states

**Completion condition:** The application has a cohesive, polished product identity.

## Phase 7 — Quality Assurance and Deployment

Deliverables:

- Unit tests
- Integration tests
- End-to-end tests
- Error handling
- Accessibility improvements
- Security verification
- Performance optimization
- Vercel deployment
- README
- Environment variable documentation

**Completion condition:** A new user can successfully complete the entire application workflow on the deployed site.

---

# 31. Development Rules for the AI Agent

The AI coding agent must follow these requirements throughout implementation.

## 31.1 Build a Real Application

Do not produce:

- Static dashboard mockups
- Nonfunctional forms
- Buttons without handlers
- Fake authentication
- Hardcoded user data masquerading as real data
- Simulated AI responses presented as actual model output
- Placeholder analytics presented as user progress
- Nonpersistent task management
- Decorative calendars with no working scheduling logic

Every core feature must be connected to a functioning backend or a clearly identified development fixture.

## 31.2 Follow the PRD

Implement all P0 requirements before adding optional features.

Maintain consistent naming across:

- Frontend components
- API endpoints
- Database fields
- TypeScript types
- Validation schemas

Do not arbitrarily rename core product features.

## 31.3 Reuse UI Libraries

Before manually building a reusable UI component:

1. Check shadcn/ui.
2. Check relevant available Untitled UI components.
3. Check HeroUI.
4. Check Watermelon UI.
5. Determine whether the component already exists in the codebase.
6. Implement custom code only if necessary.

Use the real component code and documented APIs.

Do not reproduce the visual appearance of a library component from scratch if an implementation can be used directly.

## 31.4 Maintain Design Consistency

Even when using multiple libraries:

- Share common design tokens.
- Normalize fonts and spacing.
- Use consistent border radii.
- Maintain common interaction patterns.
- Avoid duplicate visual styles.
- Prefer one standard dialog, button, and form system.

## 31.5 Implement Secure Architecture

- Use real Supabase authentication.
- Enable appropriate RLS.
- Protect server routes.
- Validate user input.
- Store sensitive environment values securely.
- Do not expose OpenAI API keys to browsers.

## 31.6 Verify Work

After each implementation phase:

- Run TypeScript checks.
- Run linting.
- Run relevant tests.
- Fix reported problems.
- Verify affected routes.
- Confirm core interactions.
- Avoid introducing unused dependencies.

Never describe a feature as completed if only the frontend mockup exists.

---

# 32. MVP Success Metrics

The following are product targets, not existing user statistics.

| Metric | Initial Target |
|---|---|
| Onboarding completion | 70%+ |
| Users accepting their first plan | 60%+ |
| Users completing at least one session after planning | 50%+ |
| Successful generation requests | 95%+ |
| Unauthorized cross-user data access | 0 |
| Critical test pass rate | 100% |
| Functional mobile experience | Required |

For a portfolio deployment, quality should also be demonstrated through:

- Real authentication
- Real persistent data
- Reliable schedule generation
- A working AI integration
- Responsive UI
- Documented architecture
- Automated tests
- Accessible components
- A publicly accessible deployment

---

# 33. Future Roadmap

Potential post-MVP features:

### Version 1.1

- Spaced repetition
- Study streaks
- Calendar integrations
- Improved AI workload estimation
- More analytics
- Recurring academic assignments

### Version 1.2

- AI flashcard generation
- Study material uploads
- Smart revision recommendations
- AI-generated practice quizzes
- Exam readiness estimates

### Version 2.0

- Full AI study assistant
- Personalized learning insights
- Collaborative study groups
- Advanced adaptive learning
- Mobile applications
- Integrations with educational platforms

Do not implement these during the initial MVP unless all P0 functionality is already stable.

---

# 34. Master Implementation Instruction

**The following instruction should be used with an AI coding agent together with this PRD.**

You are a senior full-stack software engineer, SaaS product designer, and application architect responsible for building Studium, a complete AI-powered study planning web application.

Your goal is to implement the complete MVP described in this Product Requirements Document.

Build a production-quality application, not a prototype.

Use Next.js, React, TypeScript, Tailwind CSS, Supabase, and OpenAI as the core stack.

Use shadcn/ui as the primary UI system. Actively consult Watermelon UI, Untitled UI React, and HeroUI for suitable existing components and application patterns. Use Motion for React (Framer Motion) and Anime.js for carefully chosen animation requirements.

**Do not generate common UI components from scratch when reliable library components already exist.**

Your responsibilities:

1. Inspect the existing repository before changing it.
2. Initialize the project if no suitable application exists.
3. Configure compatible dependencies.
4. Establish the visual design system.
5. Implement authentication and database architecture.
6. Implement all required onboarding screens.
7. Build functional subject, topic, task, and assessment management.
8. Build the availability editor.
9. Implement the AI recommendation service.
10. Implement a deterministic, constraint-aware scheduling engine.
11. Build schedule generation, preview, acceptance, and replanning.
12. Implement the calendar interface.
13. Build the focus timer with persistent state.
14. Implement real analytics.
15. Build the responsive landing page.
16. Add loading, empty, error, and success states.
17. Implement responsive layouts and accessibility.
18. Write relevant tests.
19. Configure deployment readiness.
20. Create a complete README and `.env.example`.

### Execution Principles

- Implement the application incrementally, following the phases in the PRD.
- Use maintainable architecture and readable TypeScript.
- Reuse established libraries and components.
- Avoid unnecessary packages.
- Do not fabricate API integrations or backend behavior.
- Keep frontend and backend data contracts consistent.
- Use secure authentication and database authorization.
- Respect timezone and scheduling constraints.
- Preserve completed study history.
- Never automatically overwrite user-edited plans without approval.
- Use actual user data throughout the application.
- Produce polished, consistent UI.
- Test the critical end-to-end workflow.
- Fix build errors and failing tests before considering implementation complete.
- Document any functionality that requires external credentials.
- Clearly report any requirement that remains incomplete.

When implementation details are unspecified, use sensible defaults consistent with the product goals.

Prioritize functionality, reliability, usability, and design coherence over unnecessary complexity.

The final application must allow a new user to register, create their academic profile, generate an AI-assisted study plan, accept a schedule, complete study sessions, and review their progress.

**Final definition of done: Studium must operate as a functional end-to-end AI Study Planner, with persistent data, working backend functionality, and a polished responsive interface.**

---

**END OF PRD — STUDIUM MVP v1.0**