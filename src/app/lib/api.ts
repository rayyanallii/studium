import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

import type {
  ActivePlan,
  AnalyticsData,
  Assessment,
  AvailabilityOverride,
  AvailabilityWindow,
  DashboardData,
  FocusRun,
  GeneratePlanInput,
  Me,
  PlanProposal,
  Preferences,
  StudySession,
  Subject,
  Task,
  Topic,
} from '../../shared/types'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      accept: 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(rest.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    /* empty body */
  }
  const envelope = body as { success?: boolean; data?: T; error?: { code?: string; message?: string; details?: unknown } } | null
  if (!response.ok || envelope?.success === false) {
    throw new ApiError(
      response.status,
      envelope?.error?.message ?? response.statusText ?? 'Something went wrong.',
      envelope?.error?.code,
      envelope?.error?.details,
    )
  }
  return (envelope?.data ?? (body as T)) as T
}

const ALL_KEYS = ['me', 'subjects', 'subject', 'tasks', 'assessments', 'availability', 'planner', 'activePlan', 'dashboard', 'analytics', 'focus']

function refresh(client: QueryClient, extra: string[] = []) {
  return Promise.all([...new Set([...ALL_KEYS, ...extra])].map((key) => client.invalidateQueries({ queryKey: [key] })))
}

/* ---------------------------------------------------------------- account */

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/me'), retry: false, staleTime: 60_000 })

export function useUpdateProfile() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<{ displayName: string; academicContext: Me['profile']['academicContext']; learningGoal: string | null; timezone: string; onboardingStep: number; onboardingCompleted: boolean }>) =>
      api<{ profile: Me['profile'] }>('/me', { method: 'PATCH', json: input }),
    onSuccess: () => refresh(client),
  })
}

export function useUpdatePreferences() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<Preferences>) => api<{ preferences: Preferences }>('/me/preferences', { method: 'PATCH', json: input }),
    onSuccess: () => refresh(client),
  })
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: () => api<{ deleted: boolean }>('/account?confirm=delete', { method: 'DELETE' }) })
}

/* --------------------------------------------------------------- subjects */

export const useSubjects = () => useQuery({ queryKey: ['subjects'], queryFn: () => api<{ items: Subject[] }>('/subjects') })

export const useSubject = (id: string | undefined) =>
  useQuery({
    queryKey: ['subject', id],
    queryFn: () => api<{ subject: Subject; topics: Topic[] }>(`/subjects/${id}`),
    enabled: Boolean(id),
  })

export function useSaveSubject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id?: string; values: Record<string, unknown> }): Promise<unknown> =>
      input.id
        ? api<{ updated: boolean }>(`/subjects/${input.id}`, { method: 'PATCH', json: input.values })
        : api<{ id: string }>('/subjects', { method: 'POST', json: input.values }),
    onSuccess: () => refresh(client),
  })
}

export function useDeleteSubject() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => refresh(client),
  })
}

export function useSaveTopic() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { subjectId: string; id?: string; values: Record<string, unknown> }): Promise<unknown> =>
      input.id
        ? api<{ updated: boolean }>(`/topics/${input.id}`, { method: 'PATCH', json: input.values })
        : api<{ id: string }>(`/subjects/${input.subjectId}/topics`, { method: 'POST', json: input.values }),
    onSuccess: () => refresh(client),
  })
}

export function useDeleteTopic() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/topics/${id}`, { method: 'DELETE' }),
    onSuccess: () => refresh(client),
  })
}

/* ------------------------------------------------------------------ tasks */

export interface TaskFilters {
  filter?: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'archived'
  subjectId?: string
  priority?: string
  sort?: 'due' | 'priority' | 'created'
}

export const useTasks = (filters: TaskFilters = {}) => {
  const query = new URLSearchParams()
  if (filters.filter && filters.filter !== 'all') query.set('filter', filters.filter)
  if (filters.subjectId) query.set('subjectId', filters.subjectId)
  if (filters.priority) query.set('priority', filters.priority)
  if (filters.sort) query.set('sort', filters.sort)
  const suffix = query.toString()
  return useQuery({
    queryKey: ['tasks', suffix],
    queryFn: () => api<{ items: Task[]; counts: { open: number; overdue: number; completed: number } }>(`/tasks${suffix ? `?${suffix}` : ''}`),
  })
}

export function useSaveTask() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id?: string; values: Record<string, unknown> }) =>
      input.id
        ? api<{ task: Task }>(`/tasks/${input.id}`, { method: 'PATCH', json: input.values })
        : api<{ task: Task }>('/tasks', { method: 'POST', json: input.values }),
    onSuccess: () => refresh(client),
  })
}

export function useDeleteTask() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => refresh(client),
  })
}

export function useReopenTask() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ task: Task }>(`/tasks/${id}/reopen`, { method: 'POST' }),
    onSuccess: () => refresh(client),
  })
}

/* ------------------------------------------------------------ assessments */

export const useAssessments = () => useQuery({ queryKey: ['assessments'], queryFn: () => api<{ items: Assessment[] }>('/assessments') })

export function useSaveAssessment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id?: string; values: Record<string, unknown> }): Promise<unknown> =>
      input.id
        ? api<{ updated: boolean }>(`/assessments/${input.id}`, { method: 'PATCH', json: input.values })
        : api<{ id: string }>('/assessments', { method: 'POST', json: input.values }),
    onSuccess: () => refresh(client),
  })
}

export function useDeleteAssessment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/assessments/${id}`, { method: 'DELETE' }),
    onSuccess: () => refresh(client),
  })
}

/* ----------------------------------------------------------- availability */

export const useAvailability = () =>
  useQuery({ queryKey: ['availability'], queryFn: () => api<{ rules: AvailabilityWindow[]; overrides: AvailabilityOverride[] }>('/availability') })

export function useSaveAvailability() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (rules: { weekday: number; startLocalTime: string; endLocalTime: string }[]) =>
      api<{ saved: number }>('/availability', { method: 'PUT', json: { rules } }),
    onSuccess: () => refresh(client),
  })
}

export function useSaveOverrides() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (overrides: { localDate: string; startLocalTime: string | null; endLocalTime: string | null; isUnavailable: boolean }[]) =>
      api<{ saved: number }>('/availability/overrides', { method: 'PUT', json: { overrides } }),
    onSuccess: () => refresh(client),
  })
}

/* ---------------------------------------------------------------- planner */

export const usePlanner = (from: number, to: number) =>
  useQuery({
    queryKey: ['planner', from, to],
    queryFn: () => api<{ items: StudySession[]; totals: { plannedMinutes: number; completedMinutes: number; completed: number; missed: number; count: number } }>(`/sessions/summary?from=${from}&to=${to}`),
    staleTime: 10_000,
  })

export const useActivePlan = () => useQuery({ queryKey: ['activePlan'], queryFn: () => api<ActivePlan>('/plans/active') })

export function useGeneratePlan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: GeneratePlanInput) =>
      api<{ proposal: PlanProposal | null; reason?: string; message?: string }>('/plans/generate', { method: 'POST', json: input }),
    onSuccess: () => refresh(client, ['planHistory']),
  })
}

export function useAcceptPlan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ plan: PlanProposal; sessions: StudySession[]; dropped: number }>(`/plans/${id}/accept`, { method: 'POST' }),
    onSuccess: () => refresh(client),
  })
}

export function useDiscardPlan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ discarded: boolean }>(`/plans/${id}/discard`, { method: 'POST' }),
    onSuccess: () => refresh(client),
  })
}

/* --------------------------------------------------------------- sessions */

export function useSaveSession() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id?: string; values: Record<string, unknown> }) =>
      input.id
        ? api<{ session: StudySession }>(`/sessions/${input.id}`, { method: 'PATCH', json: input.values })
        : api<{ session: StudySession }>('/sessions', { method: 'POST', json: input.values }),
    onSuccess: () => refresh(client),
  })
}

export function useSessionAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; action: 'complete' | 'skip' | 'delete' | 'unlock'; actualMinutes?: number; markTaskComplete?: boolean }): Promise<unknown> => {
      if (input.action === 'delete') return api<{ deleted: boolean }>(`/sessions/${input.id}`, { method: 'DELETE' })
      if (input.action === 'unlock') return api<{ session: StudySession }>(`/sessions/${input.id}`, { method: 'PATCH', json: { isLocked: false } })
      if (input.action === 'skip') return api<{ session: StudySession }>(`/sessions/${input.id}/skip`, { method: 'POST' })
      return api<{ session: StudySession }>(`/sessions/${input.id}/complete`, { method: 'POST', json: { actualMinutes: input.actualMinutes, markTaskComplete: input.markTaskComplete } })
    },
    onSuccess: () => refresh(client),
  })
}

/* ----------------------------------------------------------------- focus */

export const useActiveFocus = () =>
  useQuery({ queryKey: ['focus'], queryFn: () => api<{ run: FocusRun | null }>('/focus/active'), staleTime: 5_000, refetchOnMount: 'always' })

export function useStartFocus() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { studySessionId?: string | null; subjectId?: string | null; plannedMinutes: number }) =>
      api<{ run: FocusRun; sessionTitle?: string | null; resumed?: boolean }>('/focus/start', { method: 'POST', json: input }),
    onSuccess: () => refresh(client),
  })
}

export function useFocusAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; action: 'pause' | 'resume' | 'finish'; completed?: boolean; markSessionComplete?: boolean; actualMinutes?: number }) =>
      api<{ run: FocusRun; session?: StudySession | null; recordedMinutes?: number }>(`/focus/${input.id}/${input.action}`, {
        method: 'POST',
        json: input.action === 'finish' ? { completed: input.completed, markSessionComplete: input.markSessionComplete, actualMinutes: input.actualMinutes } : undefined,
      }),
    onSuccess: () => refresh(client),
  })
}

/* -------------------------------------------------------------- analytics */

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => api<DashboardData>('/dashboard') })

export const useAnalytics = (days: 7 | 30) => useQuery({ queryKey: ['analytics', days], queryFn: () => api<AnalyticsData>(`/analytics?days=${days}`) })

export const useSubjectAnalytics = (id: string | undefined) =>
  useQuery({
    queryKey: ['analytics', 'subject', id],
    queryFn: () => api<{ totals: { minutes: number; planned: number; completed: number; sessions: number }; recent: StudySession[] }>(`/analytics/subjects/${id}`),
    enabled: Boolean(id),
  })

/* ------------------------------------------------------------------ demo */

export function useSeedDemo() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (replace: boolean) => api<{ seeded: { subjects: number; sessions: number }; replaced: boolean }>(`/account/demo${replace ? '?replace=1' : ''}`, { method: 'POST' }),
    onSuccess: () => refresh(client),
  })
}
