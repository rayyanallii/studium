import { CircleCheck, Ellipsis, Pencil, RotateCcw, Trash } from 'lucide-react'
import { useState } from 'react'

import type { Task } from '../../shared/types'
import { ApiError, useDeleteTask, useSaveTask } from '../lib/api'
import { cx } from '../lib/cx'
import { dueLabel, minutesLabel } from '../lib/format'
import { Badge, ConfirmDialog, Menu, useToast } from './ui'

const priorityTone = { high: 'danger', medium: 'warning', low: 'neutral' } as const

export function TaskRow({ task, timezone, onEdit, showSubject = true }: { task: Task; timezone: string; onEdit: (task: Task) => void; showSubject?: boolean }) {
  const toast = useToast()
  const save = useSaveTask()
  const remove = useDeleteTask()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const done = task.status === 'completed'
  const due = dueLabel(task.dueAt, timezone)
  const remaining = Math.max(0, task.estimatedMinutes - task.completedMinutes)

  const toggle = () => {
    save.mutate(
      { id: task.id, values: { status: done ? 'todo' : 'completed' } },
      {
        onSuccess: () => toast(done ? 'Task reopened' : 'Task completed'),
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'sessions_exist') setConfirmRemove(true)
          else toast(error.message, 'danger')
        },
      },
    )
  }

  return (
    <div className={cx('group flex items-center gap-3 border-b border-line px-3 py-3 last:border-b-0 sm:px-4', done && 'opacity-60')}>
      <button
        type="button"
        onClick={toggle}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        className={cx(
          'grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
          done ? 'border-success bg-success text-white' : 'border-line-strong text-transparent hover:border-accent hover:text-accent',
        )}
      >
        {done ? <CircleCheck className="size-3.5" /> : <span className="size-2 rounded-full bg-current" />}
      </button>

      <button type="button" onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left">
        <span className={cx('block truncate text-[13.5px] font-medium', done && 'line-through')}>{task.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-faint">
          {showSubject && task.subjectName && (
            <span className="inline-flex items-center gap-1.5">
              <span className="round size-1.5 rounded-full" style={{ background: task.subjectColor }} />
              {task.subjectName}
            </span>
          )}
          {task.topicName && <span>· {task.topicName}</span>}
          <span>· {minutesLabel(remaining)} left</span>
          {task.scheduledMinutes > 0 && <span>· {minutesLabel(task.scheduledMinutes)} planned</span>}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        {!done && <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>}
        {task.dueAt && !done && <Badge tone={due.tone === 'danger' ? 'danger' : due.tone === 'warning' ? 'warning' : 'neutral'}>{due.label}</Badge>}
        <Menu
          trigger={
            <button type="button" aria-label={`Actions for ${task.title}`} className="grid size-8 place-items-center rounded-tile text-faint hover:bg-surface-2 hover:text-fg">
              <Ellipsis className="size-4" />
            </button>
          }
          items={[
            { label: done ? 'Reopen task' : 'Edit task', icon: done ? <RotateCcw /> : <Pencil />, onSelect: () => (done ? toggle() : onEdit(task)) },
            { label: 'Delete task', icon: <Trash />, danger: true, onSelect: () => setDeleting(true) },
          ]}
        />
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          save.mutate(
            { id: task.id, values: { status: 'completed', confirmRemoveSessions: true } },
            {
              onSuccess: () => {
                setConfirmRemove(false)
                toast('Task completed and sessions removed')
              },
            },
          )
        }}
        loading={save.isPending}
        title="Complete this task?"
        description="It still has upcoming study sessions. Completing it removes them from your plan; you can replan the remaining work afterwards."
        confirmLabel="Complete and remove"
      />

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() =>
          remove.mutate(task.id, {
            onSuccess: () => {
              setDeleting(false)
              toast('Task deleted')
            },
          })
        }
        loading={remove.isPending}
        title={`Delete “${task.title}”?`}
        description="Its study sessions stay in your history, but the task and its remaining work are removed."
      />
    </div>
  )
}
