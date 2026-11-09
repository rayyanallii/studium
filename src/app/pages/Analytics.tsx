import { CircleCheck, Clock, ListChecks, Target, Timer, TriangleExclamationPoint } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Badge, Card, EmptyState, PageHeader, Progress, Segmented, Skeleton, Stat } from '../components/ui'
import { useAnalytics } from '../lib/api'
import { dateLabel, minutesLabel } from '../lib/format'

export function Analytics() {
  const [days, setDays] = useState<7 | 30>(7)
  const { data, isLoading } = useAnalytics(days)

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[96px] rounded-card" />
          ))}
        </div>
        <Skeleton className="h-[280px] rounded-card" />
      </div>
    )
  }

  const daily = data.daily.map((day) => ({
    label: dateLabel(day.date, days === 7 ? { weekday: 'short' } : { month: 'numeric', day: 'numeric' }),
    minutes: day.minutes,
    planned: day.planned,
  }))
  const maxSubject = Math.max(1, ...data.subjects.map((subject) => subject.minutes))
  const chartStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 12, fontSize: 12 }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Analytics"
        subtitle={`${minutesLabel(data.totals.studyMinutes)} of confirmed study in the last ${days} days`}
        actions={
          <Segmented
            value={String(days) as '7' | '30'}
            onChange={(value) => setDays(Number(value) as 7 | 30)}
            options={[
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
            ]}
          />
        }
      />

      {!data.hasData ? (
        <Card>
          <EmptyState
            icon={<Timer />}
            title="No confirmed study time yet"
            description="Complete a focus session or mark a planned session complete, and your real progress will appear here."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Total study time" value={minutesLabel(data.totals.studyMinutes)} hint={`${data.totals.focusRuns} focus runs`} icon={<Clock />} />
            <Stat label="Planned vs actual" value={`${data.totals.completionRate}%`} hint={`${minutesLabel(data.totals.plannedMinutes)} was planned`} icon={<Target />} />
            <Stat label="Session completion" value={`${data.totals.completedSessions}/${data.totals.eligibleSessions}`} hint="Eligible sessions completed" icon={<CircleCheck />} />
            <Stat label="Average session" value={minutesLabel(data.totals.averageSessionMinutes)} hint="Confirmed time per completed session" icon={<Timer />} />
          </div>

          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold">Daily study minutes</h2>
              <div className="flex items-center gap-3 text-[11.5px] text-faint">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-accent" /> Actual
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-raised" /> Planned
                </span>
              </div>
            </div>
            <div className="mt-4 h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--color-faint)', fontSize: 11 }} axisLine={false} tickLine={false} interval={days === 30 ? 4 : 0} />
                  <YAxis tick={{ fill: 'var(--color-faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartStyle} formatter={(value) => minutesLabel(Number(value))} labelStyle={{ color: 'var(--color-fg)' }} />
                  <Bar dataKey="planned" name="Planned" fill="var(--color-raised)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minutes" name="Studied" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <Card className="p-4 sm:p-5">
              <h2 className="text-[14px] font-semibold">Subject distribution</h2>
              {data.subjects.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-muted">No subject activity in this period.</p>
              ) : (
                <div className="mt-3 grid items-center gap-4 sm:grid-cols-[180px_1fr]">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.subjects} dataKey="minutes" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none">
                          {data.subjects.map((subject) => (
                            <Cell key={subject.id} fill={subject.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartStyle} formatter={(value) => minutesLabel(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {data.subjects.map((subject) => (
                      <li key={subject.id}>
                        <div className="flex items-center justify-between gap-2 text-[12.5px]">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <span className="round size-2 shrink-0 rounded-full" style={{ background: subject.color }} />
                            <span className="truncate">{subject.name}</span>
                          </span>
                          <span className="shrink-0 tabular text-muted">{minutesLabel(subject.minutes)}</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full" style={{ width: `${(subject.minutes / maxSubject) * 100}%`, background: subject.color }} />
                        </div>
                        {subject.targetMinutes && <p className="mt-0.5 text-[10.5px] text-faint">{minutesLabel(subject.planned)} planned this period</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="p-4 sm:p-5">
                <h2 className="text-[14px] font-semibold">Plan adherence</h2>
                <p className="mt-3 text-[26px] font-semibold tabular">{data.totals.completionRate}%</p>
                <p className="text-[12px] text-muted">of sessions that have ended were completed</p>
                <Progress value={data.totals.completionRate} className="mt-3" tone={data.totals.completionRate >= 70 ? 'success' : 'warning'} />
                <p className="mt-2 text-[11.5px] text-faint">
                  {data.totals.completedSessions} completed of {data.totals.eligibleSessions} eligible sessions.
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <h2 className="text-[14px] font-semibold">Tasks</h2>
                <ul className="mt-3 flex flex-col gap-2.5 text-[13px]">
                  <li className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-muted">
                      <CircleCheck className="size-4 text-success" /> Completed
                    </span>
                    <span className="font-medium tabular">{data.tasks.completed}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-muted">
                      <ListChecks className="size-4" /> Remaining
                    </span>
                    <span className="font-medium tabular">{data.tasks.remaining}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-muted">
                      <TriangleExclamationPoint className="size-4 text-danger" /> Overdue
                    </span>
                    <Badge tone={data.tasks.overdue > 0 ? 'danger' : 'success'}>{data.tasks.overdue}</Badge>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
