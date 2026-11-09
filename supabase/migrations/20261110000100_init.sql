-- Studium initial schema.
-- Every workspace-owned table carries workspace_id so row-level security can be
-- applied uniformly (see 20261110000200_rls.sql). Timestamps are timestamptz
-- (UTC); a user's IANA timezone lives on their profile.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- identity --

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  academic_context text check (academic_context in ('school', 'university', 'competitive', 'self', 'other')),
  learning_goal text,
  timezone text not null default 'UTC',
  onboarding_step smallint not null default 1 check (onboarding_step between 1 and 6),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Personal workspace',
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MVP rule: exactly one default personal workspace per user.
create unique index workspaces_one_default_per_owner on public.workspaces (owner_user_id) where is_default;

create table public.study_preferences (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  preferred_session_minutes integer not null default 50 check (preferred_session_minutes between 5 and 240),
  break_minutes integer not null default 10 check (break_minutes between 0 and 60),
  max_daily_minutes integer not null default 240 check (max_daily_minutes between 15 and 1440),
  planning_horizon_days integer not null default 7 check (planning_horizon_days between 1 and 31),
  planning_style text not null default 'balanced' check (planning_style in ('balanced', 'deadline', 'difficult')),
  theme text not null default 'dark' check (theme in ('light', 'dark', 'system')),
  urgent_first boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------- academic structure --

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  color text not null default '#635BFF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  weekly_target_minutes integer check (weekly_target_minutes between 15 and 10080),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subjects_workspace on public.subjects (workspace_id) where deleted_at is null;

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chapters_subject on public.chapters (subject_id, position);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  estimated_minutes integer check (estimated_minutes between 5 and 6000),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topics_subject on public.topics (subject_id);

create table public.study_goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  target_date date,
  status text not null default 'active' check (status in ('active', 'achieved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_goal_subjects (
  goal_id uuid not null references public.study_goals (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  primary key (goal_id, subject_id)
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  due_at timestamptz not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assessments_workspace_due on public.assessments (workspace_id, due_at);

create table public.assessment_subjects (
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  primary key (assessment_id, subject_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  goal_id uuid references public.study_goals (id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed', 'archived')),
  due_at timestamptz,
  estimated_minutes integer not null default 60 check (estimated_minutes between 5 and 1440),
  completed_minutes integer not null default 0 check (completed_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_workspace_status on public.tasks (workspace_id, status, due_at);
create index tasks_subject on public.tasks (subject_id);

-- ------------------------------------------------------------ availability --

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_local_time time not null,
  end_local_time time not null,
  created_at timestamptz not null default now(),
  check (end_local_time > start_local_time)
);
create unique index availability_rules_unique_window on public.availability_rules (workspace_id, weekday, start_local_time);

create table public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  local_date date not null,
  start_local_time time,
  end_local_time time,
  is_unavailable boolean not null default false,
  created_at timestamptz not null default now(),
  check (is_unavailable or (start_local_time is not null and end_local_time is not null and end_local_time > start_local_time))
);
create unique index availability_overrides_unique_date on public.availability_overrides (workspace_id, local_date);

-- ---------------------------------------------------------------- materials --

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  chapter_id uuid references public.chapters (id) on delete set null,
  topic_id uuid references public.topics (id) on delete set null,
  type text not null check (type in ('pdf', 'docx', 'image', 'text', 'note')),
  title text not null check (char_length(title) between 1 and 160),
  mime text not null default 'text/plain',
  bytes integer not null default 0 check (bytes >= 0),
  storage_path text,
  version integer not null default 1 check (version >= 1),
  extraction_status text not null default 'ready' check (extraction_status in ('uploaded', 'processing', 'ready', 'failed')),
  extracted_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index materials_workspace on public.materials (workspace_id, created_at desc);

create table public.material_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  material_version integer not null default 1,
  text text not null,
  page_start integer,
  page_end integer,
  sort_order integer not null default 0
);
create index material_chunks_material on public.material_chunks (material_id, sort_order);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  topic_id uuid references public.topics (id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  content text not null default '',
  origin text not null default 'user' check (origin in ('user', 'ai')),
  source_material_id uuid references public.materials (id) on delete set null,
  source_version integer,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------- AI artifacts --

-- A saved study set produced from one or more materials (summary, flashcards,
-- quiz or notebook guide). Content stays editable JSON so drafts are preserved.
create table public.study_artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  topic_id uuid references public.topics (id) on delete set null,
  kind text not null check (kind in ('summary', 'flashcards', 'quiz', 'notebook')),
  title text not null check (char_length(title) between 1 and 160),
  content jsonb not null default '{}'::jsonb,
  source_material_ids uuid[] not null default '{}',
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index study_artifacts_workspace on public.study_artifacts (workspace_id, kind, created_at desc);

create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  artifact_id uuid not null references public.study_artifacts (id) on delete cascade,
  card_index integer not null check (card_index >= 0),
  rating smallint not null check (rating between 1 and 4),
  learned boolean not null default false,
  reviewed_at timestamptz not null default now(),
  prior_state jsonb,
  new_state jsonb
);
create index flashcard_reviews_artifact on public.flashcard_reviews (artifact_id, card_index, reviewed_at desc);

-- Currently the app stores deck schedule state per card in `content`; the table
-- below is the target location once the FSRS scheduler lands in the API.
create table public.flashcard_schedules (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  artifact_id uuid not null references public.study_artifacts (id) on delete cascade,
  card_index integer not null check (card_index >= 0),
  due_at timestamptz not null default now(),
  stability double precision,
  difficulty double precision,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state smallint not null default 0,
  last_reviewed_at timestamptz,
  primary key (artifact_id, card_index)
);
create index flashcard_schedules_due on public.flashcard_schedules (workspace_id, due_at);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  artifact_id uuid not null references public.study_artifacts (id) on delete cascade,
  status text not null default 'submitted' check (status in ('in_progress', 'submitted', 'abandoned')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score integer not null default 0 check (score >= 0),
  max_score integer not null default 0 check (max_score >= 0),
  answers jsonb not null default '[]'::jsonb
);
create index quiz_attempts_artifact on public.quiz_attempts (artifact_id, started_at desc);

create table public.quiz_responses (
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_index integer not null check (question_index >= 0),
  selected_option_id text,
  is_correct boolean,
  primary key (attempt_id, question_index)
);

create table public.notebook_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  artifact_id uuid not null references public.study_artifacts (id) on delete cascade,
  question text not null,
  answer text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index notebook_messages_artifact on public.notebook_messages (artifact_id, created_at);

create table public.topic_progress (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  questions_answered integer not null default 0,
  questions_correct integer not null default 0,
  reviews integer not null default 0,
  again_ratings integer not null default 0,
  last_practiced_at timestamptz,
  status text not null default 'not_enough_data' check (status in ('not_enough_data', 'needs_attention', 'improving', 'steady')),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, topic_id)
);

create table public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  idempotency_key text not null,
  source_material_ids uuid[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create table public.ai_generation_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null,
  status text not null check (status in ('succeeded', 'failed')),
  request_id text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, request_id)
);
create index ai_generation_usage_workspace on public.ai_generation_usage (workspace_id, created_at desc);

-- ------------------------------------------------------------ planning -------

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  version integer not null default 1 check (version >= 1),
  start_date date not null,
  end_date date not null,
  status text not null default 'proposed' check (status in ('proposed', 'active', 'superseded', 'discarded')),
  origin text not null default 'heuristic' check (origin in ('ai', 'heuristic')),
  input_fingerprint text,
  explanation text,
  summary jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  unscheduled jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  check (end_date >= start_date),
  unique (workspace_id, start_date, end_date, version)
);
create index study_plans_workspace_status on public.study_plans (workspace_id, status, created_at desc);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  plan_id uuid references public.study_plans (id) on delete set null,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  artifact_id uuid references public.study_artifacts (id) on delete set null,
  activity_type text not null default 'learn' check (activity_type in ('learn', 'review', 'quiz', 'practice', 'focus')),
  title text not null check (char_length(title) between 1 and 160),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  planned_minutes integer not null check (planned_minutes between 5 and 600),
  actual_minutes integer not null default 0 check (actual_minutes >= 0),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'partially_completed', 'missed', 'skipped', 'canceled')),
  is_locked boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index study_sessions_workspace_start on public.study_sessions (workspace_id, starts_at);
create index study_sessions_plan on public.study_sessions (plan_id);
create index study_sessions_task on public.study_sessions (task_id);

create table public.focus_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  study_session_id uuid references public.study_sessions (id) on delete set null,
  subject_id uuid references public.subjects (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  started_at timestamptz not null default now(),
  last_resumed_at timestamptz,
  ended_at timestamptz,
  planned_seconds integer not null default 1500 check (planned_seconds between 60 and 86400),
  accumulated_focus_seconds integer not null default 0 check (accumulated_focus_seconds >= 0),
  status text not null default 'running' check (status in ('running', 'paused', 'completed', 'abandoned')),
  created_at timestamptz not null default now()
);
create index focus_runs_workspace on public.focus_runs (workspace_id, started_at desc);

-- ----------------------------------------------------- provisioning ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace uuid;
  resolved_name text;
begin
  resolved_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Student'
  );

  insert into public.profiles (id, display_name)
  values (new.id, left(resolved_name, 60))
  on conflict (id) do nothing;

  insert into public.workspaces (owner_user_id, name, is_default)
  values (new.id, 'Personal workspace', true)
  on conflict do nothing
  returning id into new_workspace;

  if new_workspace is not null then
    insert into public.study_preferences (workspace_id) values (new_workspace);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------- updated_at triggers -

do $$
declare
  target text;
begin
  foreach target in array array[
    'profiles', 'workspaces', 'subjects', 'chapters', 'topics', 'study_goals',
    'assessments', 'tasks', 'materials', 'notes', 'study_artifacts',
    'study_sessions', 'topic_progress'
  ] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', target);
    execute format(
      'create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()',
      target
    );
  end loop;
end;
$$;
