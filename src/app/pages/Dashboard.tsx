import { ArrowRight, BookOpen, CalendarDays, CircleCheck, Clock, Flame, ListChecks, Plus, Sparkles, Target } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { DateTime } from 'luxon'
import { Link, useNavigate } from 'react-router'

import type { StudySession } from '../../shared/types'
import { GeneratePlanDialog } from '../components/GeneratePlanDialog'
import { SessionDetails } from '../components/SessionDetails'
import { SessionCard } from '../components/SessionCard'
import { SubjectDialog } from '../components/SubjectDialog'
import { TaskDialog } from '../components/TaskDialog'
import { StudyTools } from '../components/StudyTools'
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Skeleton, Stat } from '../components/ui'
import { useDashboard, useMe } from '../lib/api'
import { dateLabel, minutesLabel, percent, untilLabel } from '../lib/format'

export function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboard()
  const { data: me } = useMe()
  const timezone = me?.profile.timezone ?? 'UTC'
  const navigate = useNavigate()
  const [planOpen, setPlanOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [selected, setSelected] = useState<StudySession | null>(null)

  if (error) return <Alert tone="danger" title="Your dashboard could not load" action={<Button onClick={() => void refetch()}>Try again</Button>}>{error.message}</Alert>

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[96px] rounded-card" />
          ))}
        </div>
        <Skeleton className="h-[280px] rounded-card" />
      </div>
    )
  }

  const todayPlanned = data.today.plannedMinutes
  const todayCompleted = data.today.completedMinutes
  const hour = DateTime.now().setZone(timezone).hour
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const hasSubjects = data.subjects.length > 0
  const maxDaily = Math.max(60, ...data.week.daily.map((day) => day.planned))

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title={`${greeting}, ${data.greetingName}`}
        subtitle="What would you like to learn today?"
        actions={
          data.nextSession ? (
            <Button variant="primary" onClick={() => navigate(`/focus?session=${data.nextSession!.id}`)}>
              <Flame />
              Start studying
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setPlanOpen(true)} disabled={!hasSubjects}>
              <Sparkles />
              Generate plan
            </Button>
          )
        }
      />

      <StudyTools />

      {data.needsAttention.missedSessions > 0 && (
        <Alert
          tone="warning"
          title={`${data.needsAttention.missedSessions} ${data.needsAttention.missedSessions === 1 ? 'session needs' : 'sessions need'} attention`}
          action={
            <Button size="sm" onClick={() => setPlanOpen(true)}>
              Replan this week
              <ArrowRight />
            </Button>
          }
        >
          Missed sessions stay in your history. Replanning moves the remaining work into the time you still have.
        </Alert>
      )}

      <div className="dashboard-stats grid grid-cols-2 gap-y-2 border-y border-line py-5 lg:grid-cols-4">
        <Stat label="Planned today" value={minutesLabel(todayPlanned)} hint={`${data.today.sessions.length} ${data.today.sessions.length === 1 ? 'session' : 'sessions'}`} icon={<CalendarDays />} />
        <Stat label="Studied today" value={minutesLabel(todayCompleted)} hint={todayPlanned > 0 ? `${percent(todayCompleted, todayPlanned)}% of today's plan` : 'Nothing planned yet'} icon={<Clock />} />
        <Stat label="Upcoming tasks" value={String(data.upcomingTasks.length)} hint={`${data.needsAttention.overdueTasks} overdue`} icon={<ListChecks />} />
        <Stat label="Week completion" value={`${data.week.completionRate}%`} hint={`${data.week.completedSessions} of ${data.week.plannedSessions} sessions`} icon={<Target />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-semibold">Today&apos;s schedule</h2>
              <p className="mt-0.5 text-[14px] text-muted">
                {todayPlanned > 0 ? `${minutesLabel(todayCompleted)} of ${minutesLabel(todayPlanned)} done` : 'No sessions planned yet'}
              </p>
            </div>
            <Link to="/planner" className="text-[14px] font-medium text-accent hover:underline">
              Open planner
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {data.today.sessions.length > 0 ? (
              data.today.sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  timezone={timezone}
                  onOpen={() => setSelected(session)}
                  onStart={() => navigate(`/focus?session=${session.id}`)}
                />
              ))
            ) : (
              <EmptyState
                icon={<CalendarDays />}
                title="Nothing scheduled for today"
                description={hasSubjects ? 'Generate a plan to fill your week, or add a session manually.' : 'Your study workspace starts with a subject.'}
                action={
                  hasSubjects ? (
                    <Button variant="primary" onClick={() => setPlanOpen(true)}>
                      <Sparkles />
                      Generate plan
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => setSubjectOpen(true)}>
                      <Plus />
                      Add subject
                    </Button>
                  )
                }
              />
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">This week</h2>
              <Badge tone={data.week.completionRate >= 70 ? 'success' : data.week.completionRate >= 40 ? 'warning' : 'neutral'}>
                {minutesLabel(data.week.completedMinutes)} / {minutesLabel(data.week.plannedMinutes)}
              </Badge>
            </div>
            <div className="mt-4 flex h-[104px] items-end gap-2" aria-hidden>
              {data.week.daily.map((day) => (
                <div key={day.date} className="flex h-full flex-1 flex-col justify-end gap-1">
                  <div className="relative flex w-full flex-col justify-end" style={{ height: '100%' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(2, (day.planned / maxDaily) * 100)}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="relative w-full rounded-t-[4px] bg-surface-2"
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-[4px] bg-accent"
                        style={{ height: `${day.planned > 0 ? Math.min(100, (day.completed / day.planned) * 100) : 0}%` }}
                      />
                    </motion.div>
                  </div>
                  <span className="text-center text-[9.5px] text-faint">{dateLabel(day.date, { weekday: 'narrow' })}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-faint">Solid bars are confirmed study time; the pale track is what was planned.</p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Upcoming deadlines</h2>
              <Link to="/subjects" className="text-[14px] font-medium text-accent hover:underline">
                Manage
              </Link>
            </div>
            {data.deadlines.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">No assessments coming up.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {data.deadlines.map((deadline) => (
                  <li key={deadline.id} className="flex items-center gap-2.5">
                    <span className="round size-2 shrink-0 rounded-full" style={{ background: deadline.subjectColor ?? '#635BFF' }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{deadline.title}</span>
                      <span className="block text-[13px] text-faint">{deadline.subjectName}</span>
                    </span>
                    <span className="shrink-0 rounded-tile bg-warning-soft px-2 py-1 text-[11px] font-medium text-warning">{untilLabel(deadline.dueAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)]">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold">Subject progress</h2>
            <Link to="/analytics" className="text-[14px] font-medium text-accent hover:underline">
              Analytics
            </Link>
          </div>
          {data.subjects.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">Add a subject to start tracking progress.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3.5">
              {data.subjects.map((subject) => {
                const goal = subject.targetMinutes ?? Math.max(60, subject.plannedWeekMinutes)
                const value = percent(subject.studiedWeekMinutes, goal)
                return (
                  <li key={subject.id}>
                    <div className="flex items-center justify-between gap-3 text-[14px]">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <span className="round size-2 shrink-0 rounded-full" style={{ background: subject.color }} />
                        <span className="truncate font-medium">{subject.name}</span>
                      </span>
                      <span className="shrink-0 tabular text-muted">
                        {minutesLabel(subject.studiedWeekMinutes)}
                        {subject.targetMinutes ? ` / ${minutesLabel(subject.targetMinutes)}` : ''}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, value)}%`, background: subject.color }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-[14px] font-semibold">Quick actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Add task', icon: ListChecks, onClick: () => setTaskOpen(true), disabled: !hasSubjects },
              { label: 'Add subject', icon: BookOpen, onClick: () => setSubjectOpen(true) },
              { label: 'Generate plan', icon: Sparkles, onClick: () => setPlanOpen(true), disabled: !hasSubjects },
              { label: 'Focus session', icon: Flame, onClick: () => navigate('/focus') },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={action.onClick}
                className="flex flex-col items-start gap-2 rounded-card border border-line px-3 py-3 text-left transition-colors hover:border-accent/40 hover:bg-accent-soft/40 disabled:pointer-events-none disabled:opacity-50"
              >
                <action.icon className="size-4 text-accent" />
                <span className="text-[14px] font-medium">{action.label}</span>
              </button>
            ))}
          </div>
          {!data.needsAttention.hasActivePlan && hasSubjects && (
            <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-relaxed text-faint">
              <CircleCheck className="mt-0.5 size-3.5 shrink-0" />
              No active plan yet. Generating one creates a proposal you can review first.
            </p>
          )}
        </Card>
      </div>

      <GeneratePlanDialog open={planOpen} onClose={() => setPlanOpen(false)} />
      <TaskDialog open={taskOpen} onClose={() => setTaskOpen(false)} />
      <SubjectDialog open={subjectOpen} onClose={() => setSubjectOpen(false)} />
      <SessionDetails session={selected} timezone={timezone} onClose={() => setSelected(null)} onStart={(id) => navigate(`/focus?session=${id}`)} />
    </div>
  )
}
