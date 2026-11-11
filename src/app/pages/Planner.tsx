import { CalendarDays, ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const moveSession = useSaveSession()
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

  const startHour = 0, endHour = 24

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
          moving={moveSession.isPending}
          onMove={(session, startsAt) => moveSession.mutate({ id: session.id, values: { startsAt, endsAt: startsAt + session.endsAt - session.startsAt } }, { onSuccess: () => toast('Session moved'), onError: error => toast(error.message, 'danger') })}
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
          <span className="text-faint">Drag a session to move it in 15-minute steps, or tap to edit its exact time.</span>
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
  onMove,
  moving,
}: {
  days: string[]
  sessions: StudySession[]
  timezone: string
  startHour: number
  endHour: number
  onSelect: (session: StudySession) => void
  onMove: (session: StudySession, startsAt: number) => void
  moving: boolean
}) {
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null)
  const [target, setTarget] = useState<{ day: string; minutes: number } | null>(null)
  const hourHeight = 56
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => { if (scroller.current) { const first = sessions.filter(session => DateTime.fromMillis(session.startsAt, { zone: timezone }).toISODate() === days[0])[0] ?? sessions[0]; scroller.current.scrollTop = Math.max(0, (first ? DateTime.fromMillis(first.startsAt, { zone: timezone }).hour - 1 : 8) * hourHeight) } }, [days.join(',')])
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index)
  const today = todayKey(timezone)

  return (
    <Card className="overflow-hidden">
      <div ref={scroller} className="max-h-[70vh] overflow-auto">
        <div className={days.length === 1 ? 'min-w-[300px]' : 'min-w-[640px]'}>
          <div className="sticky top-0 z-20 grid border-b border-line bg-panel" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}>
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
              const nextDay = DateTime.fromISO(day, { zone: timezone }).plus({ days: 1 }).startOf('day').toMillis()
              const daySessions = sessions.filter((session) => session.startsAt >= dayStart && session.startsAt < nextDay)
              return (
                <div key={day} data-calendar-day={day} className={cx('relative border-l border-line', day === today && 'bg-accent-soft/15')}
                  onDragOver={event => { if (!drag || moving) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const minutes = Math.max(0, Math.min(1439, Math.round(((event.clientY - event.currentTarget.getBoundingClientRect().top - drag.offset) / hourHeight * 60 + startHour * 60) / 15) * 15)); setTarget({ day, minutes }) }}
                  onDrop={event => { event.preventDefault(); if (drag && target?.day === day && !moving) { const session = sessions.find(item => item.id === drag.id); const start = DateTime.fromISO(day, { zone: timezone }).set({ hour: Math.floor(target.minutes / 60), minute: target.minutes % 60 }); if (session && start.isValid && start.toMillis() !== session.startsAt) onMove(session, start.toMillis()) } setDrag(null); setTarget(null) }}>
                  {hours.map((hour) => (
                    <div key={hour} className="border-b border-line/50" style={{ height: hourHeight }} />
                  ))}
                  {daySessions.map((session) => {
                    const localStart = DateTime.fromMillis(session.startsAt, { zone: timezone })
                    const top = (localStart.hour + localStart.minute / 60 - startHour) * hourHeight
                    const height = Math.max(24, ((session.endsAt - session.startsAt) / 3_600_000) * hourHeight - 3)
                    const done = session.status === 'completed'
                    const missed = session.status === 'missed' || session.status === 'skipped'
                    return (
                      <button
                        key={session.id}
                        type="button"
                        draggable={!moving && session.status === 'planned'}
                        onDragStart={event => { setDrag({ id: session.id, offset: event.clientY - event.currentTarget.getBoundingClientRect().top }); event.dataTransfer.setData('text/plain', session.id); event.dataTransfer.effectAllowed = 'move' }}
                        onDragEnd={() => { setDrag(null); setTarget(null) }}
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
                  {target?.day === day && drag && <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-blue-500 bg-panel px-1 text-xs text-fg" style={{ top: (target.minutes / 60 - startHour) * hourHeight }}>{String(Math.floor(target.minutes / 60)).padStart(2, '0')}:{String(target.minutes % 60).padStart(2, '0')}</div>}
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
