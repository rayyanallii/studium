import { CalendarDays, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import type { StudySession } from '../../shared/types'
import { GeneratePlanDialog } from '../components/GeneratePlanDialog'
import { SessionDetails } from '../components/SessionDetails'
import { DateInput, FieldInput, TimeInput } from '../components/fields'
import { Alert, Button, Card, Dialog, EmptyState, Field, PageHeader, Segmented, Select, Skeleton, useToast } from '../components/ui'
import { useMe, usePlanner, useSaveSession, useSubjects } from '../lib/api'
import { cx } from '../lib/cx'
import { combine, dateLabel, minutesLabel, nowTimeInput, todayKey } from '../lib/format'

export function Planner() {
  const { data: me } = useMe()
  const timezone = me?.profile.timezone ?? 'UTC'
  const navigate = useNavigate()
  const toast = useToast()
  const [view, setView] = useState<'week' | 'day'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'day' : 'week'))
  const [anchor, setAnchor] = useState(() => todayKey(timezone))
  const [selected, setSelected] = useState<StudySession | null>(null)
  const [planOpen, setPlanOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  const days = useMemo(() => {
    const base = DateTime.fromISO(anchor, { zone: timezone })
    if (view === 'day') return [anchor]
    const start = base.startOf('week')
    return Array.from({ length: 7 }, (_, index) => start.plus({ days: index }).toISODate() ?? anchor)
  }, [anchor, timezone, view])

  const from = DateTime.fromISO(days[0], { zone: timezone }).startOf('day').toMillis()
  const to = DateTime.fromISO(days[days.length - 1], { zone: timezone }).plus({ days: 1 }).startOf('day').toMillis()
  const { data, isLoading } = usePlanner(from, to)
  const sessions = data?.items ?? []

  const shift = (direction: number) => {
    const next = DateTime.fromISO(anchor, { zone: timezone }).plus({ days: direction * (view === 'week' ? 7 : 1) })
    setAnchor(next.toISODate() ?? anchor)
  }

  const { startHour, endHour } = useMemo(() => {
    // The grid is drawn from startHour, so sessions must be positioned
    // relative to it rather than to midnight.
    if (sessions.length === 0) return { startHour: 8, endHour: 22 }
    let earliest = 24
    let latest = 0
    for (const session of sessions) {
      const start = DateTime.fromMillis(session.startsAt, { zone: timezone })
      const end = DateTime.fromMillis(session.endsAt, { zone: timezone })
      const endHour = end.minute > 0 ? end.hour + 1 : end.hour
      if (start.hour < earliest) earliest = start.hour
      if (endHour > latest) latest = endHour
    }
    return { startHour: Math.max(0, earliest - 1), endHour: Math.min(24, Math.max(earliest + 4, latest + 1)) }
  }, [sessions, timezone])

  const label =
    view === 'day'
      ? dateLabel(anchor, { weekday: 'long', month: 'long', day: 'numeric' })
      : `${dateLabel(days[0], { month: 'short', day: 'numeric' })} – ${dateLabel(days[6], { month: 'short', day: 'numeric' })}`

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Planner"
        subtitle={label}
        actions={
          <>
            <Button onClick={() => setNewOpen(true)}>
              <Plus />
              Add session
            </Button>
            <Button variant="primary" onClick={() => setPlanOpen(true)}>
              <Sparkles />
              Generate plan
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button size="icon" aria-label="Previous" onClick={() => shift(-1)}>
            <ChevronLeft />
          </Button>
          <Button size="sm" onClick={() => setAnchor(todayKey(timezone))}>
            Today
          </Button>
          <Button size="icon" aria-label="Next" onClick={() => shift(1)}>
            <ChevronRight />
          </Button>
        </div>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'week', label: 'Week' },
            { value: 'day', label: 'Day' },
          ]}
        />
      </div>

      {data && data.totals.missed > 0 && (
        <Alert
          tone="warning"
          title={`${data.totals.missed} ${data.totals.missed === 1 ? 'session needs' : 'sessions need'} attention`}
          action={
            <Button size="sm" onClick={() => setPlanOpen(true)}>
              Replan the week
            </Button>
          }
        >
          Missed and skipped sessions stay in your history. Replanning redistributes the work that is left.
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-[520px] rounded-card" />
      ) : sessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays />}
            title="No study sessions scheduled"
            description="Generate a plan from your subjects and availability, or add a one-off session."
            action={
              <div className="flex gap-2">
                <Button onClick={() => setNewOpen(true)}>
                  <Plus />
                  Add session
                </Button>
                <Button variant="primary" onClick={() => setPlanOpen(true)}>
                  <Sparkles />
                  Generate plan
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <CalendarGrid
          days={days}
          sessions={sessions}
          timezone={timezone}
          startHour={startHour}
          endHour={endHour}
          onSelect={setSelected}
        />
      )}

      {data && sessions.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[14px] text-muted">
          <span>
            <span className="font-medium text-fg">{minutesLabel(data.totals.plannedMinutes)}</span> planned
          </span>
          <span>
            <span className="font-medium text-fg">{minutesLabel(data.totals.completedMinutes)}</span> completed
          </span>
          <span>
            <span className="font-medium text-fg">{data.totals.completed}</span> completed sessions
          </span>
          <span className="text-faint">Tap a session to reschedule, skip or start it.</span>
        </div>
      )}

      <GeneratePlanDialog open={planOpen} onClose={() => setPlanOpen(false)} replan />
      <SessionDetails session={selected} timezone={timezone} onClose={() => setSelected(null)} onStart={(id) => navigate(`/focus?session=${id}`)} />
      {newOpen && <NewSessionDialog onClose={() => setNewOpen(false)} timezone={timezone} defaultDate={anchor} onSaved={() => toast('Session added')} />}
    </div>
  )
}

function CalendarGrid({
  days,
  sessions,
  timezone,
  startHour,
  endHour,
  onSelect,
}: {
  days: string[]
  sessions: StudySession[]
  timezone: string
  startHour: number
  endHour: number
  onSelect: (session: StudySession) => void
}) {
  const hourHeight = 56
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index)
  const today = todayKey(timezone)

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid border-b border-line" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
            <div />
            {days.map((day) => (
              <div key={day} className={cx('border-l border-line px-2 py-2 text-center', day === today && 'bg-accent-soft/40')}>
                <p className={cx('text-[11px] uppercase tracking-[0.08em]', day === today ? 'text-accent' : 'text-faint')}>{dateLabel(day, { weekday: 'short' })}</p>
                <p className={cx('text-[14px] font-semibold', day === today ? 'text-accent' : '')}>{dateLabel(day, { day: 'numeric' })}</p>
              </div>
            ))}
          </div>

          <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
            <div>
              {hours.map((hour) => (
                <div key={hour} className="relative border-b border-line/50" style={{ height: hourHeight }}>
                  <span className="absolute -top-1.5 right-2 text-[10px] tabular text-faint">{formatHour(hour)}</span>
                </div>
              ))}
            </div>

            {days.map((day) => {
              const dayStart = DateTime.fromISO(day, { zone: timezone }).startOf('day').toMillis()
              const daySessions = sessions.filter((session) => session.startsAt >= dayStart && session.startsAt < dayStart + 86_400_000)
              return (
                <div key={day} className={cx('relative border-l border-line', day === today && 'bg-accent-soft/15')}>
                  {hours.map((hour) => (
                    <div key={hour} className="border-b border-line/50" style={{ height: hourHeight }} />
                  ))}
                  {daySessions.map((session) => {
                    const top = ((session.startsAt - dayStart) / 3_600_000 - startHour) * hourHeight
                    const height = Math.max(24, ((session.endsAt - session.startsAt) / 3_600_000) * hourHeight - 3)
                    const done = session.status === 'completed'
                    const missed = session.status === 'missed' || session.status === 'skipped'
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => onSelect(session)}
                        title={`${session.title} · ${minutesLabel(session.plannedMinutes)}`}
                        className={cx(
                          'absolute left-1 right-1 overflow-hidden rounded-[7px] border-l-[3px] px-1.5 py-1 text-left transition-opacity hover:opacity-90',
                          done && 'opacity-70',
                          missed && 'opacity-60',
                        )}
                        style={{
                          top: Math.max(0, top),
                          height,
                          borderLeftColor: session.subjectColor,
                          background: `color-mix(in srgb, ${session.subjectColor} ${done ? 10 : 16}%, var(--color-panel))`,
                        }}
                      >
                        <span className={cx('block truncate text-[10.5px] font-semibold leading-tight', done && 'line-through')} style={{ color: session.subjectColor }}>
                          {session.title}
                        </span>
                        {height > 38 && (
                          <span className="mt-0.5 block truncate text-[9.5px] text-muted">
                            {DateTime.fromMillis(session.startsAt, { zone: timezone }).toFormat('h:mm a')} · {minutesLabel(session.plannedMinutes)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

function addHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const total = ((hours || 0) * 60 + (minutes || 0) + 60) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function formatHour(hour: number): string {
  if (hour === 0) return '12a'
  if (hour === 12) return '12p'
  return hour < 12 ? `${hour}a` : `${hour - 12}p`
}

function NewSessionDialog({ onClose, timezone, defaultDate, onSaved }: { onClose: () => void; timezone: string; defaultDate: string; onSaved: () => void }) {
  const { data: subjects } = useSubjects()
  const save = useSaveSession()
  const [form, setForm] = useState({
    subjectId: subjects?.items[0]?.id ?? '',
    title: '',
    date: defaultDate,
    start: nowTimeInput(timezone),
    end: DateTime.now().setZone(timezone).plus({ minutes: 60 }).toFormat('HH:mm'),
  })
  const error = save.error

  const submit = () => {
    const subjectId = form.subjectId || subjects?.items[0]?.id
    if (!subjectId || !form.title.trim()) return
    save.mutate(
      {
        values: {
          subjectId,
          title: form.title.trim(),
          startsAt: combine(form.date, form.start, timezone),
          endsAt: combine(form.date, form.end, timezone),
        },
      },
      {
        onSuccess: () => {
          onSaved()
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a study session"
      description="Manual sessions stay locked, so future replans leave them alone."
      width={540}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={save.isPending} disabled={!form.title.trim() || !(form.subjectId || subjects?.items[0])}>
            Add session
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="What are you studying?">
          <FieldInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Practice past papers" autoFocus />
        </Field>
        <Field label="Subject">
          <Select value={form.subjectId} onValueChange={(value) => setForm({ ...form, subjectId: value })}>
            <option value="">Choose a subject</option>
            {(subjects?.items ?? []).map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
          <Field label="Date" className="min-[420px]:col-span-2">
            <DateInput value={form.date} onValueChange={(value) => setForm({ ...form, date: value })} />
          </Field>
          <Field label="Start">
            <TimeInput label="Start" value={form.start} onValueChange={(value) => setForm({ ...form, start: value, end: addHour(value) })} />
          </Field>
          <Field label="End">
            <TimeInput label="End" value={form.end} onValueChange={(value) => setForm({ ...form, end: value })} />
          </Field>
        </div>
        {error && <p className="text-[14px] text-danger">{error.message}</p>}
      </div>
    </Dialog>
  )
}
