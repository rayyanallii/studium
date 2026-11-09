import { useState } from 'react'

import { PRIORITIES, type Assessment } from '../../shared/types'
import { useMe, useSaveAssessment, useSubjects } from '../lib/api'
import { combine, toDateInput, toTimeInput, todayKey } from '../lib/format'
import { DateInput, FieldInput, FieldTextarea, TimeInput } from './fields'
import { Button, Dialog, Field, Select, useToast } from './ui'

export function AssessmentDialog({ open, onClose, assessment, defaultSubjectId }: { open: boolean; onClose: () => void; assessment?: Assessment | null; defaultSubjectId?: string }) {
  const toast = useToast()
  const { data: me } = useMe()
  const { data: subjects } = useSubjects()
  const timezone = me?.profile.timezone ?? 'UTC'
  const [form, setForm] = useState(() => hydrate(assessment, defaultSubjectId, timezone))
  const [loadedFor, setLoadedFor] = useState<string | null>(assessment?.id ?? 'new')

  if (open && (assessment?.id ?? 'new') !== loadedFor) {
    setForm(hydrate(assessment, defaultSubjectId, timezone))
    setLoadedFor(assessment?.id ?? 'new')
  }

  const save = useSaveAssessment()
  const submit = () => {
    const subjectId = form.subjectId || subjects?.items[0]?.id
    if (!subjectId || !form.dueDate) return
    save.mutate(
      {
        id: assessment?.id,
        values: {
          title: form.title.trim(),
          subjectId,
          description: form.description.trim() || null,
          dueAt: combine(form.dueDate, form.dueTime || '09:00', timezone),
          priority: form.priority,
        },
      },
      {
        onSuccess: () => {
          toast(assessment ? 'Assessment updated' : 'Assessment added — replan to include it')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={assessment ? 'Edit assessment' : 'New assessment'}
      description="Exams and deadlines pull study work earlier in the plan."
      width={520}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={save.isPending} disabled={!form.title.trim() || !form.dueDate || !(form.subjectId || subjects?.items[0])}>
            {assessment ? 'Save changes' : 'Add assessment'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Title">
          <FieldInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Calculus midterm" autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as typeof form.priority })}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority[0].toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <DateInput min={todayKey(timezone)} value={form.dueDate} onValueChange={(value) => setForm({ ...form, dueDate: value })} />
          </Field>
          <Field label="Start time" hint="Optional.">
            <TimeInput label="Start time" value={form.dueTime} onValueChange={(value) => setForm({ ...form, dueTime: value })} />
          </Field>
        </div>
        <Field label="Notes" hint="Optional.">
          <FieldTextarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-[70px]" />
        </Field>
        {save.error && <p className="text-[15px] text-danger">{save.error.message}</p>}
      </div>
    </Dialog>
  )
}

function hydrate(assessment: Assessment | null | undefined, defaultSubjectId: string | undefined, timezone: string) {
  return {
    title: assessment?.title ?? '',
    subjectId: assessment?.subjectId ?? defaultSubjectId ?? '',
    description: assessment?.description ?? '',
    priority: assessment?.priority ?? ('high' as 'low' | 'medium' | 'high'),
    dueDate: assessment?.dueAt ? toDateInput(assessment.dueAt, timezone) : '',
    dueTime: assessment?.dueAt ? toTimeInput(assessment.dueAt, timezone) : '09:00',
  }
}
