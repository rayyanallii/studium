// Types shared by the Worker (src/worker) and the app (src/app).
// Every API payload in this file is the single contract between the two.

export const BRAND = 'Studium'
export const TAGLINE = 'Plan smarter. Study better.'

export type AcademicContext = 'school' | 'university' | 'competitive' | 'self' | 'other'
export type Priority = 'low' | 'medium' | 'high'
export type TopicStatus = 'not_started' | 'in_progress' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived'
export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'missed' | 'skipped' | 'canceled'
export type PlanStatus = 'proposed' | 'active' | 'superseded' | 'discarded'
export type PlanningStyle = 'balanced' | 'deadline' | 'difficult'
export type Theme = 'light' | 'dark' | 'system'
export type FocusStatus = 'running' | 'paused' | 'completed' | 'abandoned'
export type GenerationSource = 'ai' | 'heuristic'

export const ACADEMIC_CONTEXTS: { value: AcademicContext; label: string; detail: string }[] = [
  { value: 'school', label: 'School', detail: 'Secondary school subjects and exams' },
  { value: 'university', label: 'University', detail: 'Courses, assignments and finals' },
  { value: 'competitive', label: 'Competitive exam', detail: 'Entrance and qualification tests' },
  { value: 'self', label: 'Self-learning', detail: 'Structured personal study goals' },
  { value: 'other', label: 'Other', detail: 'Something else entirely' },
]

export const PRIORITIES: Priority[] = ['low', 'medium', 'high']
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export const SUBJECT_COLORS = ['#635BFF', '#2F77D1', '#1F9D72', '#D14457', '#B2611A', '#8B4FD1', '#0E8C93', '#C2478C']

export interface Profile {
  displayName: string
  academicContext: AcademicContext | null
  learningGoal: string | null
  timezone: string
  onboardingCompleted: boolean
  onboardingStep: number
}

export interface Preferences {
  preferredSessionMinutes: number
  breakMinutes: number
  maxDailyMinutes: number
  planningHorizonDays: number
  planningStyle: PlanningStyle
  theme: Theme
  urgentFirst: boolean
}

export interface Me {
  user: { sub: string; name?: string; email?: string; picture?: string }
  profile: Profile
  preferences: Preferences
  capabilities: { database: boolean; auth: 'supabase' | 'freebuff' | 'development'; ai: boolean; aiModel: string }
  counts: { subjects: number; openTasks: number; todaySessions: number }
}

export interface SubjectStats {
  openTasks: number
  topics: number
  topicsDone: number
  studiedWeekMinutes: number
  plannedWeekMinutes: number
  nextAssessmentAt: number | null
}

export interface Subject {
  id: string
  name: string
  description: string | null
  color: string
  priority: Priority
  difficulty: number
  weeklyTargetMinutes: number | null
  createdAt: number
  updatedAt: number
  stats: SubjectStats
}

export interface Topic {
  id: string
  subjectId: string
  name: string
  description: string | null
  estimatedMinutes: number | null
  status: TopicStatus
  createdAt: number
  updatedAt: number
}

export interface Task {
  id: string
  subjectId: string
  topicId: string | null
  title: string
  description: string | null
  priority: Priority
  status: TaskStatus
  dueAt: number | null
  estimatedMinutes: number
  completedMinutes: number
  scheduledMinutes: number
  createdAt: number
  updatedAt: number
  subjectName?: string
  subjectColor?: string
  topicName?: string
}

export interface Assessment {
  id: string
  subjectId: string
  title: string
  description: string | null
  dueAt: number
  priority: Priority
  createdAt: number
  updatedAt: number
  subjectName?: string
  subjectColor?: string
}

export interface AvailabilityWindow {
  id: string
  weekday: number // 1 = Monday … 7 = Sunday (Luxon convention)
  startLocalTime: string // 'HH:MM'
  endLocalTime: string
}

export interface AvailabilityOverride {
  id: string
  localDate: string // 'YYYY-MM-DD'
  startLocalTime: string | null
  endLocalTime: string | null
  isUnavailable: boolean
}

export interface StudySession {
  id: string
  planId: string | null
  subjectId: string
  taskId: string | null
  title: string
  startsAt: number
  endsAt: number
  plannedMinutes: number
  actualMinutes: number
  status: SessionStatus
  isLocked: boolean
  completedAt: number | null
  subjectName: string
  subjectColor: string
}

export interface ProposedSession {
  key: string
  subjectId: string
  taskId: string | null
  title: string
  startsAt: number
  endsAt: number
  plannedMinutes: number
  reason?: string
}

export interface PlanAllocation {
  subjectId: string
  subjectName: string
  color: string
  minutes: number
}

export interface PlanProposal {
  id: string
  startDate: string
  endDate: string
  version: number
  status: PlanStatus
  generationSource: GenerationSource
  summary: string
  explanation: string
  sessions: ProposedSession[]
  allocations: PlanAllocation[]
  warnings: string[]
  suggestions: string[]
  unscheduled: { taskId: string; title: string; subjectName: string; minutes: number }[]
  totals: {
    requestedMinutes: number
    availableMinutes: number
    plannedMinutes: number
    unscheduledMinutes: number
  }
  /** True when every requested minute was placed. */
  complete: boolean
  createdAt: number
  acceptedAt: number | null
}

export interface ActivePlan {
  plan: {
    id: string
    startDate: string
    endDate: string
    version: number
    status: PlanStatus
    generationSource: GenerationSource
    explanation: string | null
    createdAt: number
    acceptedAt: number | null
  } | null
  sessions: StudySession[]
}

export interface FocusRun {
  id: string
  studySessionId: string | null
  subjectId: string | null
  startedAt: number
  endedAt: number | null
  plannedSeconds: number
  accumulatedFocusSeconds: number
  lastResumedAt: number | null
  status: FocusStatus
  /** Live elapsed seconds, computed server-side so a background tab stays honest. */
  elapsedSeconds: number
  subjectName: string | null
  subjectColor: string | null
  sessionTitle: string | null
  taskId: string | null
}

export interface DashboardData {
  date: string
  greetingName: string
  today: { plannedMinutes: number; completedMinutes: number; sessions: StudySession[] }
  week: {
    plannedMinutes: number
    completedMinutes: number
    plannedSessions: number
    completedSessions: number
    completionRate: number
    daily: { date: string; planned: number; completed: number }[]
  }
  nextSession: StudySession | null
  upcomingTasks: Task[]
  deadlines: Assessment[]
  subjects: { id: string; name: string; color: string; plannedWeekMinutes: number; studiedWeekMinutes: number; targetMinutes: number | null }[]
  needsAttention: { missedSessions: number; overdueTasks: number; hasActivePlan: boolean }
}

export interface AnalyticsData {
  range: { from: string; to: string; days: number }
  totals: {
    studyMinutes: number
    plannedMinutes: number
    completedSessions: number
    eligibleSessions: number
    completionRate: number
    focusRuns: number
    averageSessionMinutes: number
  }
  daily: { date: string; minutes: number; planned: number }[]
  subjects: { id: string; name: string; color: string; minutes: number; planned: number; targetMinutes: number | null }[]
  tasks: { completed: number; remaining: number; overdue: number }
  hasData: boolean
}

export interface GeneratePlanInput {
  startDate?: string
  horizonDays?: number
  subjectIds?: string[]
  planningStyle?: PlanningStyle
  useAi?: boolean
  requestId: string
}
