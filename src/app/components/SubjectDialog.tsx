import { useState } from 'react'

import { PRIORITIES, SUBJECT_COLORS, type Subject } from '../../shared/types'
import { useSaveSubject } from '../lib/api'
import { cx } from '../lib/cx'
import { Button, Dialog, Field, Input, Select, Textarea, useFieldId, useToast } from './ui'

function FieldInput(props: React.ComponentPropsWithoutRef<typeof Input>) {
  const id = useFieldId()
  return <Input id={id} {...props} />
}
function FieldTextarea(props: React.ComponentPropsWithoutRef<typeof Textarea>) {
  const id = useFieldId()
  return <Textarea id={id} {...props} />
}

const blank = {
  name: '',
  description: '',
  color: SUBJECT_COLORS[0],
  priority: 'medium' as 'low' | 'medium' | 'high',
  difficulty: 3,
  weeklyTargetHours: '',
}

export function SubjectDialog({ open, onClose, subject }: { open: boolean; onClose: () => void; subject?: Subject | null }) {
  const toast = useToast()
  const [form, setForm] = useState(() => hydrate(subject))
  const [loadedFor, setLoadedFor] = useState<string | null>(subject?.id ?? null)

  // Re-seed the form when a different subject is opened.
  if (open && (subject?.id ?? null) !== loadedFor) {
    setForm(hydrate(subject))
    setLoadedFor(subject?.id ?? null)
  }

  const save = useSaveSubject()

  const submit = () => {
    const hours = Number(form.weeklyTargetHours)
    const weeklyTargetMinutes = form.weeklyTargetHours.trim() && Number.isFinite(hours) ? Math.round(hours * 60) : null
    save.mutate(
      {
        id: subject?.id,
        values: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          color: form.color,
          priority: form.priority,
          difficulty: form.difficulty,
          weeklyTargetMinutes,
        },
      },
      {
        onSuccess: () => {
          toast(subject ? 'Subject updated' : 'Subject added')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={subject ? 'Edit subject' : 'New subject'}
      description="Subjects carry the colour, priority and difficulty that shape your plan."
      width={520}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={save.isPending} disabled={!form.name.trim()}>
            {subject ? 'Save changes' : 'Add subject'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Subject name">
          <FieldInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Mathematics" autoFocus />
        </Field>
        <Field label="Description" hint="Optional — what this subject covers.">
          <FieldTextarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-[64px]" placeholder="Calculus, algebra and problem sets" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as typeof form.priority })}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority[0].toUpperCase() + priority.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Weekly target" hint="Hours per week, optional.">
            <FieldInput
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={form.weeklyTargetHours}
              onChange={(event) => setForm({ ...form, weeklyTargetHours: event.target.value })}
              placeholder="6"
            />
          </Field>
        </div>

        <div>
          <p className="text-[15px] font-medium">Difficulty</p>
          <div className="mt-1.5 flex gap-1.5" role="radiogroup" aria-label="Difficulty">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={form.difficulty === level}
                onClick={() => setForm({ ...form, difficulty: level })}
                className={cx(
                  'h-9 flex-1 rounded-control border text-[15px] font-medium transition-colors',
                  form.difficulty === level ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-muted hover:bg-surface-2',
                )}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[14px] text-faint">Harder subjects get more weight when the plan is built.</p>
        </div>

        <div>
          <p className="text-[15px] font-medium">Colour</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use colour ${color}`}
                aria-pressed={form.color === color}
                onClick={() => setForm({ ...form, color })}
                className={cx('round size-8 rounded-full transition-transform', form.color === color ? 'scale-110 ring-2 ring-fg ring-offset-2 ring-offset-surface' : 'hover:scale-105')}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>

        {save.error && <p className="text-[15px] text-danger">{save.error.message}</p>}
      </div>
    </Dialog>
  )
}

function hydrate(subject?: Subject | null) {
  if (!subject) return blank
  return {
    name: subject.name,
    description: subject.description ?? '',
    color: subject.color,
    priority: subject.priority,
    difficulty: subject.difficulty,
    weeklyTargetHours: subject.weeklyTargetMinutes ? String(subject.weeklyTargetMinutes / 60) : '',
  }
}
