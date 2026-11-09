import { Check, Clock, Lock, Play } from 'lucide-react'

import type { StudySession } from '../../shared/types'
import { cx } from '../lib/cx'
import { minutesLabel, timeRange } from '../lib/format'
import { Badge } from './ui'

const statusTone = {
  planned: 'neutral',
  in_progress: 'accent',
  completed: 'success',
  missed: 'danger',
  skipped: 'warning',
  canceled: 'neutral',
} as const

const statusLabel = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  missed: 'Missed',
  skipped: 'Skipped',
  canceled: 'Canceled',
} as const

export function SessionCard({
  session,
  timezone,
  onOpen,
  onStart,
  compact,
}: {
  session: StudySession
  timezone: string
  onOpen?: () => void
  onStart?: () => void
  compact?: boolean
}) {
  const done = session.status === 'completed'
  return (
    <div
      className={cx(
        'group flex items-center gap-3 rounded-card border bg-panel px-3 py-2.5 transition-colors',
        done ? 'border-success/25 bg-success-soft/30' : 'border-line hover:border-line-strong',
        compact && 'px-3 py-2',
      )}
    >
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: session.subjectColor }} />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[15px] font-medium">{session.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[15px] text-faint">
          <span>{session.subjectName}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {timeRange(session.startsAt, session.endsAt, timezone)}
          </span>
          <span aria-hidden>·</span>
          <span>{minutesLabel(session.plannedMinutes)}</span>
          {session.isLocked && (
            <span className="inline-flex items-center gap-1 text-warning" title="Locked against replanning">
              <Lock className="size-3" />
              Locked
            </span>
          )}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        <Badge tone={statusTone[session.status]} className="hidden sm:inline-flex">
          {done && <Check className="size-3" />}
          {statusLabel[session.status]}
        </Badge>
        {onStart && (session.status === 'planned' || session.status === 'in_progress') && (
          <button
            type="button"
            onClick={onStart}
            aria-label={`Start ${session.title}`}
            className="grid size-8 place-items-center rounded-tile bg-accent-soft text-accent transition-colors hover:bg-accent hover:text-on-accent"
          >
            <Play className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
