import { useState } from 'react'

import { PRIORITIES, type Task } from '../../shared/types'
import { ApiError, useMe, useSaveTask, useSubjects, useSubject } from '../lib/api'
import { combine, toDateInput, toTimeInput, todayKey } from '../lib/format'
import { DateInput, FieldInput, FieldTextarea, NumberInput, TimeInput } from './fields'
import { Alert, Button, Dialog, Field, Select, useToast } from './ui'

export function TaskDialog({ open, onClose, task, defaultSubjectId }: { open: boolean; onClose: () => void; task?: Task | null; defaultSubjectId?: string }) {
  const toast = useToast()
  const { data: me } = useMe()
  const { data: subjects } = useSubjects()
  const timezone = me?.profile.timezone ?? 'UTC'
  const [form, setForm] = useState(() => hydrate(task, defaultSubjectId, timezone))
  const [loadedFor, setLoadedFor] = useState<string | null>(task?.id ?? 'new')

  if (open && (task?.id ?? 'new') !== loadedFor) {
    setForm(hydrate(task, defaultSubjectId, timezone))
    setLoadedFor(task?.id ?? 'new')
  }

  const { data: subjectData } = useSubject(form.subjectId || undefined)
  const save = useSaveTask()
  const needsConfirm = save.error instanceof ApiError && save.error.code === 'sessions_exist'

  const submit = (confirmRemoveSessions = false) => {
    const subjectId = form.subjectId || subjects?.items[0]?.id
    if (!subjectId) return
    const dueAt = form.dueDate ? combine(form.dueDate, form.dueTime || '18:00', timezone) : null
    save.mutate(
      {
        id: task?.id,
        values: {
          title: form.title.trim(),
          subjectId,
          topicId: form.topicId || null,
          description: form.description.trim() || null,
          priority: form.priority,
          dueAt,
          estimatedMinutes: Math.max(10, Math.round(Number(form.estimatedMinutes) || 30)),
          ...(confirmRemoveSessions ? { confirmRemoveSessions: true, status: 'completed' } : {}),
        },
      },
      {
        onSuccess: () => {
          toast(task ? 'Task updated' : 'Task added')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      description="A task is a concrete piece of work the plan can schedule."
      width={540}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => submit()} loading={save.isPending} disabled={!form.title.trim() || !(form.subjectId || subjects?.items[0])}>
            {task ? 'Save changes' : 'Add task'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Title">
          <FieldInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Practice integration problems" autoFocus />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject">
            <Select value={form.subjectId} onValueChange={(value) => setForm({ ...form, subjectId: value, topicId: '' })}>
              <option value="">Choose a subject</option>
              {(subjects?.items ?? []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Topic" hint="Optional.">
            <Select value={form.topicId} onValueChange={(value) => setForm({ ...form, topicId: value })}>
              <option value="">No topic</option>
              {(subjectData?.topics ?? []).map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as typeof form.priority })}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority[0].toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estimate" hint="Minutes">
            <NumberInput min={10} max={600} step={5} value={form.estimatedMinutes} onValueChange={(value) => setForm({ ...form, estimatedMinutes: value })} />
          </Field>
          <Field label="Due date" hint="Optional">
            <DateInput min={todayKey(timezone)} value={form.dueDate} onValueChange={(value) => setForm({ ...form, dueDate: value })} />
          </Field>
        </div>

        {form.dueDate && (
          <Field label="Due time" hint="Used as the hard deadline when planning.">
            <TimeInput label="Due time" value={form.dueTime} onValueChange={(value) => setForm({ ...form, dueTime: value })} />
          </Field>
        )}

        <Field label="Notes" hint="Optional context for you.">
          <FieldTextarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-[70px]" />
        </Field>

        {needsConfirm && (
          <Alert
            tone="warning"
            title="This task still has planned sessions"
            action={
              <Button size="sm" variant="danger" onClick={() => submit(true)} loading={save.isPending}>
                Remove sessions and complete task
              </Button>
            }
          >
            Completing the task will remove its upcoming sessions from your plan. You can also cancel and keep them.
          </Alert>
        )}
        {save.error && !needsConfirm && <p className="text-[15px] text-danger">{save.error.message}</p>}
      </div>
    </Dialog>
  )
}

function hydrate(task: Task | null | undefined, defaultSubjectId: string | undefined, timezone: string) {
  return {
    title: task?.title ?? '',
    subjectId: task?.subjectId ?? defaultSubjectId ?? '',
    topicId: task?.topicId ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? ('medium' as 'low' | 'medium' | 'high'),
    estimatedMinutes: String(task?.estimatedMinutes ?? 50),
    dueDate: task?.dueAt ? toDateInput(task.dueAt, timezone) : '',
    dueTime: task?.dueAt ? toTimeInput(task.dueAt, timezone) : '18:00',
  }
}
