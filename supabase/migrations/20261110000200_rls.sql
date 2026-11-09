-- Row-level security for every user-owned table.
-- Ownership always resolves through the workspace, so a forged workspace_id in
-- a request body cannot reach another user's rows.

-- Security definer avoids recursive policy evaluation on public.workspaces.
create or replace function public.is_workspace_owner(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = target_workspace and w.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.is_workspace_owner(uuid) from public;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

-- ------------------------------------------------------------------ profiles --

alter table public.profiles enable row level security;

drop policy if exists "profiles are owned by their user" on public.profiles;
create policy "profiles are owned by their user" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------- workspaces --

alter table public.workspaces enable row level security;

drop policy if exists "workspaces are owned by their user" on public.workspaces;
create policy "workspaces are owned by their user" on public.workspaces
  for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- ------------------------------------- tables keyed directly by workspace_id --

do $$
declare
  target text;
begin
  foreach target in array array[
    'study_preferences', 'subjects', 'chapters', 'topics', 'study_goals',
    'assessments', 'tasks', 'availability_rules', 'availability_overrides',
    'materials', 'material_chunks', 'notes', 'study_artifacts',
    'flashcard_reviews', 'flashcard_schedules', 'quiz_attempts',
    'notebook_messages', 'topic_progress', 'ai_generation_jobs',
    'ai_generation_usage', 'study_plans', 'study_sessions', 'focus_runs'
  ] loop
    execute format('alter table public.%I enable row level security', target);
    execute format('drop policy if exists "workspace owners can access" on public.%I', target);
    execute format(
      'create policy "workspace owners can access" on public.%I for all to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id))',
      target
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', target);
  end loop;
end;
$$;

-- -------------------------------------- join tables keyed by their parent row --

alter table public.study_goal_subjects enable row level security;

drop policy if exists "goal subjects follow their goal" on public.study_goal_subjects;
create policy "goal subjects follow their goal" on public.study_goal_subjects
  for all to authenticated
  using (exists (select 1 from public.study_goals g where g.id = goal_id and public.is_workspace_owner(g.workspace_id)))
  with check (exists (select 1 from public.study_goals g where g.id = goal_id and public.is_workspace_owner(g.workspace_id)));

alter table public.assessment_subjects enable row level security;

drop policy if exists "assessment subjects follow their assessment" on public.assessment_subjects;
create policy "assessment subjects follow their assessment" on public.assessment_subjects
  for all to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and public.is_workspace_owner(a.workspace_id)))
  with check (exists (select 1 from public.assessments a where a.id = assessment_id and public.is_workspace_owner(a.workspace_id)));

alter table public.quiz_responses enable row level security;

drop policy if exists "quiz responses follow their attempt" on public.quiz_responses;
create policy "quiz responses follow their attempt" on public.quiz_responses
  for all to authenticated
  using (exists (select 1 from public.quiz_attempts qa where qa.id = attempt_id and public.is_workspace_owner(qa.workspace_id)))
  with check (exists (select 1 from public.quiz_attempts qa where qa.id = attempt_id and public.is_workspace_owner(qa.workspace_id)));

grant select, insert, update, delete on public.study_goal_subjects to authenticated;
grant select, insert, update, delete on public.assessment_subjects to authenticated;
grant select, insert, update, delete on public.quiz_responses to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
