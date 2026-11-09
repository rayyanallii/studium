import { useState } from 'react'
import { LockOpen, Play, SkipForward, Trash } from 'lucide-react'

import type { StudySession } from '../../shared/types'
import { ApiError, useSaveSession, useSessionAction } from '../lib/api'
import { combine, minutesLabel, toDateInput, toTimeInput } from '../lib/format'
import { Alert, Badge, Button, Dialog, Field, Input, useFieldId, useToast } from './ui'

function FieldInput(props: React.ComponentPropsWithoutRef<typeof Input>) {
  const id = useFieldId()
  return <Input id={id} {...props} />
}

type Alternative = { startsAt: number; endsAt: number }

export function SessionDetails({
  session,
  timezone,
  onClose,
  onStart,
}: {
  session: StudySession | null
  timezone: string
  onClose: () => void
  onStart?: (id: string) => void
}) {
  const toast = useToast()
  const save = useSaveSession()
  const action = useSessionAction()
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({ date: '', start: '17:00', end: '18:00' })

  if (session && loadedFor !== session.id) {
    setForm({ date: toDateInput(session.startsAt, timezone), start: toTimeInput(session.startsAt, timezone), end: toTimeInput(session.endsAt, timezone) })
    setLoadedFor(session.id)
    setConfirmDelete(false)
  }

  if (!session) return null

  const alternatives = save.error instanceof ApiError ? ((save.error.details as { alternatives?: Alternative[] } | undefined)?.alternatives ?? []) : []
  const durationMinutes = Math.round(Number(form.end.split(':')[0]) * 60 + Number(form.end.split(':')[1]) - (Number(form.start.split(':')[0]) * 60 + Number(form.start.split(':')[1])))
  const finished = session.status === 'completed'

  const reschedule = (date = form.date, start = form.start, end = form.end) => {
    if (!date || !start || !end) return
    save.mutate(
      { id: session.id, values: { startsAt: combine(date, start, timezone), endsAt: combine(date, end, timezone) } },
      {
        onSuccess: () => {
          toast('Session moved')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open={Boolean(session)}
      onClose={onClose}
      title={session.title}
      description={`${session.subjectName} · ${minutesLabel(session.plannedMinutes)} planned`}
      width={520}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          {!finished && onStart && (
            <Button variant="primary" onClick={() => onStart(session.id)}>
              <Play />
              Start focus
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={session.status === 'completed' ? 'success' : session.status === 'missed' ? 'danger' : session.status === 'skipped' ? 'warning' : 'neutral'}>{session.status.replace('_', ' ')}</Badge>
          {session.isLocked && <Badge tone="warning">Locked against replanning</Badge>}
          <span className="text-[14px] text-faint">{minutesLabel(session.actualMinutes)} recorded</span>
        </div>

        {!finished ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Date">
                <FieldInput type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </Field>
              <Field label="Start">
                <FieldInput type="time" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
              </Field>
              <Field label="End">
                <FieldInput type="time" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
              </Field>
            </div>
            <p className="-mt-2 text-[14px] text-faint">New times are checked against your availability and other sessions. Moving a session locks it against future replans.</p>

            {save.error && (
              <Alert tone="warning" title={save.error.message}>
                {alternatives.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[14px]">These times are free:</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {alternatives.map((alternative) => (
                        <Button
                          key={alternative.startsAt}
                          size="sm"
                          onClick={() => reschedule(toDateInput(alternative.startsAt, timezone), toTimeInput(alternative.startsAt, timezone), toTimeInput(alternative.endsAt, timezone))}
                        >
                          {new Date(alternative.startsAt).toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone })}{' '}
                          {toTimeInput(alternative.startsAt, timezone)}–{toTimeInput(alternative.endsAt, timezone)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </Alert>
            )}

            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              <Button onClick={() => reschedule()} loading={save.isPending} disabled={durationMinutes < 10}>
                Save new time
              </Button>
              {session.isLocked && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    action.mutate(
                      { id: session.id, action: 'unlock' },
                      { onSuccess: () => toast('Session unlocked') },
                    )
                  }
                >
                  <LockOpen />
                  Unlock
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() =>
                  action.mutate(
                    { id: session.id, action: 'skip' },
                    { onSuccess: () => { toast('Session skipped — replan to reschedule the work'); onClose() } },
                  )
                }
              >
                <SkipForward />
                Skip
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  action.mutate(
                    { id: session.id, action: 'complete', actualMinutes: session.plannedMinutes },
                    { onSuccess: () => { toast('Session completed'); onClose() } },
                  )
                }
              >
                Mark completed
              </Button>
              {confirmDelete ? (
                <Button
                  variant="danger"
                  onClick={() =>
                    action.mutate(
                      { id: session.id, action: 'delete' },
                      { onSuccess: () => { toast('Session removed'); onClose() } },
                    )
                  }
                >
                  Confirm delete
                </Button>
              ) : (
                <Button variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setConfirmDelete(true)}>
                  <Trash />
                  Delete
                </Button>
              )}
            </div>
          </>
        ) : (
          <Alert tone="success" title="Session completed">
            {minutesLabel(session.actualMinutes)} recorded on{' '}
            {session.completedAt ? new Date(session.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: timezone }) : 'this day'}.
          </Alert>
        )}
      </div>
    </Dialog>
  )
}
