import { Check, Coffee, Pause, Play, Square, Timer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { DateTime } from 'luxon'

import type { StudySession } from '../../shared/types'
import { SessionCard } from '../components/SessionCard'
import { Alert, Badge, Button, Card, Checkbox, EmptyState, Input, PageHeader, Select, Skeleton, useFieldId, useToast } from '../components/ui'
import { useActiveFocus, useFocusAction, useMe, usePlanner, useStartFocus, useSubjects } from '../lib/api'
import { cx } from '../lib/cx'
import { minutesLabel, todayKey } from '../lib/format'

function FieldInput(props: React.ComponentPropsWithoutRef<typeof Input>) {
  const id = useFieldId()
  return <Input id={id} {...props} />
}

const DURATIONS = [25, 50] as const

export function Focus() {
  const { data: me } = useMe()
  const timezone = me?.profile.timezone ?? 'UTC'
  const { data: focus, isLoading } = useActiveFocus()
  const { data: subjects } = useSubjects()
  const startFocus = useStartFocus()
  const focusAction = useFocusAction()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const today = todayKey(timezone)
  const from = DateTime.fromISO(today, { zone: timezone }).startOf('day').toMillis()
  const to = from + 86_400_000
  const { data: planner } = usePlanner(from, to)
  const todaySessions = planner?.items ?? []

  const [now, setNow] = useState(Date.now())
  const [subjectId, setSubjectId] = useState('')
  const [minutes, setMinutes] = useState<number>(25)
  const [custom, setCustom] = useState('35')
  const [finishing, setFinishing] = useState(false)
  const [markComplete, setMarkComplete] = useState(true)
  const [summary, setSummary] = useState<{ minutes: number; session: StudySession | null } | null>(null)
  const [breakUntil, setBreakUntil] = useState<number | null>(null)
  const autoStarted = useRef(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(timer)
  }, [])

  const run = focus?.run ?? null
  const sessionParam = params.get('session')

  // "Start studying" on the dashboard lands here with a session to begin.
  useEffect(() => {
    if (autoStarted.current || isLoading || run || !sessionParam) return
    autoStarted.current = true
    startFocus.mutate({ studySessionId: sessionParam, plannedMinutes: 50 }, { onError: (error) => toast(error.message, 'danger') })
  }, [isLoading, run, sessionParam, startFocus, toast])

  const elapsed = useMemo(() => {
    if (!run) return 0
    if (run.status === 'running' && run.lastResumedAt) return run.accumulatedFocusSeconds + Math.max(0, Math.floor((now - run.lastResumedAt) / 1000))
    return run.accumulatedFocusSeconds
  }, [run, now])

  const remaining = run ? Math.max(0, run.plannedSeconds - elapsed) : 0
  const progress = run && run.plannedSeconds > 0 ? Math.min(1, elapsed / run.plannedSeconds) : 0
  const finished = run ? remaining <= 0 : false
  const breakLeft = breakUntil ? Math.max(0, Math.ceil((breakUntil - now) / 1000)) : 0

  useEffect(() => {
    if (finished && run && !finishing && !summary) setFinishing(true)
  }, [finished, run, finishing, summary])

  const chosenMinutes = minutes === 0 ? Math.min(120, Math.max(5, Number(custom) || 25)) : minutes

  const begin = () => {
    const fallback = todaySessions.find((session) => session.status === 'planned' || session.status === 'in_progress')
    const chosenSubject = subjectId || fallback?.subjectId || subjects?.items[0]?.id
    if (!chosenSubject) return
    startFocus.mutate(
      { subjectId: chosenSubject, plannedMinutes: chosenMinutes },
      { onError: (error) => toast(error.message, 'danger') },
    )
  }

  const finish = (completed: boolean) => {
    if (!run) return
    focusAction.mutate(
      { id: run.id, action: 'finish', completed, markSessionComplete: completed && markComplete },
      {
        onSuccess: (result) => {
          setFinishing(false)
          setSummary({ minutes: result.recordedMinutes ?? Math.floor(elapsed / 60), session: result.session ?? null })
          setBreakUntil(null)
          toast(completed ? 'Session recorded' : 'Partial progress recorded')
        },
        onError: (error) => toast(error.message, 'danger'),
      },
    )
  }

  if (isLoading) return <Skeleton className="h-[420px] rounded-card" />

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Focus" subtitle={run ? 'One session at a time.' : 'Start a session from your plan, or focus on anything.'} />

      {!run && !summary && (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card className="p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold">Start a focus session</h2>
            <p className="mt-1 text-[15px] text-muted">The timer uses persisted timestamps, so it stays accurate when this tab is in the background.</p>

            <div className="mt-5">
              <p className="text-[15px] font-medium">Subject</p>
              <Select value={subjectId} onValueChange={(value) => setSubjectId(value)} className="mt-1.5">
                <option value="">{todaySessions[0]?.subjectName ?? subjects?.items[0]?.name ?? 'Choose a subject'}</option>
                {(subjects?.items ?? []).map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-4">
              <p className="text-[15px] font-medium">Duration</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {DURATIONS.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setMinutes(duration)}
                    className={cx(
                      'h-10 rounded-control border px-4 text-[15px] font-medium transition-colors',
                      minutes === duration ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:bg-surface-2',
                    )}
                  >
                    {duration} min
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMinutes(0)}
                  className={cx(
                    'h-10 rounded-control border px-4 text-[15px] font-medium transition-colors',
                    minutes === 0 ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:bg-surface-2',
                  )}
                >
                  Custom
                </button>
                {minutes === 0 && (
                  <FieldInput type="number" min={5} max={120} value={custom} onChange={(event) => setCustom(event.target.value)} className="w-24" aria-label="Custom minutes" />
                )}
              </div>
            </div>

            <Button variant="primary" className="mt-6 h-11 w-full" onClick={begin} loading={startFocus.isPending} disabled={!(subjects?.items ?? []).length}>
              <Play />
              Start {chosenMinutes}-minute session
            </Button>
            {!(subjects?.items ?? []).length && <p className="mt-2 text-[14px] text-faint">Add a subject before starting a focus session.</p>}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Today&apos;s sessions</h2>
              <Badge tone="neutral">{todaySessions.length}</Badge>
            </div>
            {todaySessions.length === 0 ? (
              <EmptyState icon={<Timer />} title="Nothing planned today" description="You can still start a standalone focus session on the left." />
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {todaySessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    timezone={timezone}
                    compact
                    onStart={() => startFocus.mutate({ studySessionId: session.id, plannedMinutes: session.plannedMinutes }, { onError: (error) => toast(error.message, 'danger') })}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {summary && !run && (
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success">
              <Check className="size-7" />
            </span>
            <h2 className="mt-4 text-[20px] font-semibold">Session recorded</h2>
            <p className="mt-1 text-[15px] text-muted">
              {minutesLabel(summary.minutes)} of focused study{summary.session ? ` on ${summary.session.subjectName}` : ''} added to your progress.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => {
                  setBreakUntil(Date.now() + (me?.preferences.breakMinutes ?? 10) * 60_000)
                  setSummary(null)
                }}
              >
                <Coffee />
                Take a {me?.preferences.breakMinutes ?? 10}-minute break
              </Button>
              <Button variant="primary" onClick={() => { setSummary(null); navigate('/dashboard') }}>
                Back to dashboard
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-faint">Break time is never counted as study time.</p>
          </div>
        </Card>
      )}

      {!run && summary && breakLeft > 0 && (
        <Alert tone="info" title="Break running">
          {Math.floor(breakLeft / 60)}:{String(breakLeft % 60).padStart(2, '0')} left. This does not count toward your study minutes.
        </Alert>
      )}

      {run && (
        <Card className="mx-auto w-full max-w-xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <Badge tone={run.status === 'running' ? 'accent' : 'warning'} dot>
              {run.status === 'running' ? 'Focusing' : 'Paused'}
            </Badge>
            <p className="mt-3 text-[15px] text-muted">{run.subjectName ?? 'Focus session'}</p>
            <h2 className="mt-0.5 max-w-full truncate text-[15px] font-medium">{run.sessionTitle ?? 'Standalone session'}</h2>

            <div className="relative mt-6 grid place-items-center">
              <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
                <circle cx="110" cy="110" r="100" fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
                <circle
                  cx="110"
                  cy="110"
                  r="100"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 100}
                  strokeDashoffset={2 * Math.PI * 100 * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[42px] font-semibold leading-none tabular">
                  {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
                </span>
                <span className="mt-1 text-[14px] text-faint">{minutesLabel(Math.floor(elapsed / 60))} focused</span>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-2">
              {run.status === 'running' ? (
                <Button className="h-11 px-5" onClick={() => focusAction.mutate({ id: run.id, action: 'pause' })} loading={focusAction.isPending}>
                  <Pause />
                  Pause
                </Button>
              ) : (
                <Button className="h-11 px-5" onClick={() => focusAction.mutate({ id: run.id, action: 'resume' })} loading={focusAction.isPending}>
                  <Play />
                  Resume
                </Button>
              )}
              <Button variant="ghost" className="h-11 px-4" onClick={() => setFinishing(true)}>
                <Square />
                End session
              </Button>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-faint">
              Focused time is measured from saved timestamps, so pausing, switching tabs or refreshing never loses or invents minutes.
            </p>
          </div>
        </Card>
      )}

      {run && finishing && (
        <Card className="fixed inset-x-3 bottom-3 z-50 p-5 shadow-dialog sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[430px] sm:-translate-x-1/2 sm:-translate-y-1/2">
          <h3 className="text-[15px] font-semibold">Finish this session?</h3>
          <p className="mt-1 text-[15px] text-muted">
            You have focused for <span className="font-medium text-fg">{minutesLabel(Math.floor(elapsed / 60))}</span>. Only confirmed time is added to your analytics.
          </p>
          <label className="mt-4 flex items-start gap-2.5 rounded-tile bg-surface-2 p-3">
            <Checkbox checked={markComplete} onChange={setMarkComplete} className="mt-0.5" />
            <span className="text-[14px] leading-relaxed">Mark the planned study session as completed too.</span>
          </label>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="primary" className="h-10" onClick={() => finish(true)} loading={focusAction.isPending} disabled={Math.floor(elapsed / 60) === 0}>
              Confirm completion
            </Button>
            <Button className="h-10" onClick={() => finish(false)} loading={focusAction.isPending} disabled={Math.floor(elapsed / 60) === 0}>
              Record partial progress
            </Button>
            <Button variant="ghost" className="h-9" onClick={() => setFinishing(false)}>
              Keep studying
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
