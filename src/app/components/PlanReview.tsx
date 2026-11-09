import { CalendarDays, Sparkles, TriangleExclamationPoint } from 'lucide-react'

import type { PlanProposal, ProposedSession } from '../../shared/types'
import { cx } from '../lib/cx'
import { dateLabel, minutesLabel, timeRange } from '../lib/format'
import { Alert, Badge, Button, Card, Progress } from './ui'
import { localDateKey } from '../lib/format'

function groupByDay(sessions: ProposedSession[], timezone: string) {
  const groups = new Map<string, ProposedSession[]>()
  for (const session of sessions) {
    const key = localDateKey(session.startsAt, timezone)
    groups.set(key, [...(groups.get(key) ?? []), session])
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export function PlanReview({
  proposal,
  timezone,
  onAccept,
  onDiscard,
  accepting,
  discarding,
  acceptLabel = 'Apply this plan',
}: {
  proposal: PlanProposal
  timezone: string
  onAccept?: () => void
  onDiscard?: () => void
  accepting?: boolean
  discarding?: boolean
  acceptLabel?: string
}) {
  const groups = groupByDay(proposal.sessions, timezone)
  const total = Math.max(1, proposal.totals.requestedMinutes)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={proposal.generationSource === 'ai' ? 'accent' : 'neutral'} dot>
          {proposal.generationSource === 'ai' ? 'AI-ranked priorities' : 'Deterministic prioritisation'}
        </Badge>
        <Badge tone={proposal.complete ? 'success' : 'warning'}>{proposal.complete ? 'Everything fits' : 'Work left over'}</Badge>
        <span className="text-[14px] text-faint">
          {dateLabel(proposal.startDate, { month: 'short', day: 'numeric' })} – {dateLabel(proposal.endDate, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <p className="text-[15px] leading-relaxed text-muted">{proposal.explanation || proposal.summary}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Requested', value: minutesLabel(proposal.totals.requestedMinutes) },
          { label: 'Planned', value: minutesLabel(proposal.totals.plannedMinutes) },
          { label: 'Available', value: minutesLabel(proposal.totals.availableMinutes) },
          { label: 'Unscheduled', value: minutesLabel(proposal.totals.unscheduledMinutes) },
        ].map((item) => (
          <div key={item.label} className="rounded-card border border-line px-3 py-2.5">
            <p className="text-[15px] text-faint">{item.label}</p>
            <p className="mt-0.5 text-[15px] font-semibold tabular">{item.value}</p>
          </div>
        ))}
      </div>

      {proposal.allocations.length > 0 && (
        <Card className="p-4">
          <p className="text-[15px] font-semibold">Subject balance</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {proposal.allocations.map((allocation) => (
              <div key={allocation.subjectId}>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="inline-flex items-center gap-2">
                    <span className="round size-2 rounded-full" style={{ background: allocation.color }} />
                    {allocation.subjectName}
                  </span>
                  <span className="tabular text-muted">{minutesLabel(allocation.minutes)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((allocation.minutes / total) * 100)}%`, background: allocation.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {proposal.warnings.length > 0 && (
        <Alert tone="warning" title="Before you apply">
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {proposal.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {proposal.unscheduled.length > 0 && (
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold">
            <TriangleExclamationPoint className="size-4 text-warning" />
            Work that did not fit
          </p>
          <ul className="mt-2 divide-y divide-line">
            {proposal.unscheduled.map((item) => (
              <li key={item.taskId} className="flex items-center justify-between gap-3 py-2 text-[15px]">
                <span className="min-w-0 truncate">{item.title}</span>
                <span className="shrink-0 tabular text-faint">{minutesLabel(item.minutes)}</span>
              </li>
            ))}
          </ul>
          {proposal.suggestions.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[14px] text-muted">
              {proposal.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {groups.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.map(([date, sessions]) => (
            <div key={date}>
              <p className="text-[14px] font-medium uppercase tracking-[0.1em] text-faint">{dateLabel(date, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {sessions.map((session) => (
                  <div key={session.key} className="flex items-center gap-3 rounded-card border border-line bg-panel px-3 py-2.5">
                    <span className={cx('h-8 w-1 shrink-0 rounded-full')} style={{ background: proposal.allocations.find((a) => a.subjectId === session.subjectId)?.color ?? 'var(--color-accent)' }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{session.title}</p>
                      <p className="text-[15px] text-faint">{timeRange(session.startsAt, session.endsAt, timezone)}</p>
                    </div>
                    <span className="shrink-0 rounded-tile bg-surface-2 px-2 py-1 text-[15px] tabular text-muted">{minutesLabel(session.plannedMinutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {onAccept && (
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          {onDiscard && (
            <Button onClick={onDiscard} loading={discarding}>
              Discard
            </Button>
          )}
          <Button variant="primary" onClick={onAccept} loading={accepting} disabled={proposal.sessions.length === 0}>
            <CalendarDays />
            {acceptLabel}
          </Button>
        </div>
      )}

      <div className="flex items-start gap-2 text-[15px] leading-relaxed text-faint">
        <Sparkles className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Recommendations ranked the work; Studium&apos;s scheduler placed every session inside your availability and daily limit.
          {proposal.totals.plannedMinutes > 0 && ` Typical session ${minutesLabel(Math.round(proposal.totals.plannedMinutes / Math.max(1, proposal.sessions.length)))}.`}
        </span>
      </div>
    </div>
  )
}

export function PlanProgress({ value }: { value: number }) {
  return <Progress value={value} />
}
