import { BookOpen, CalendarDays, Ellipsis, Pencil, Plus, Trash } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'

import type { Subject } from '../../shared/types'
import { SubjectDialog } from '../components/SubjectDialog'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Menu, PageHeader, Skeleton, useToast } from '../components/ui'
import { useDeleteSubject, useSubjects } from '../lib/api'
import { dateLabel, minutesLabel, percent } from '../lib/format'

const priorityTone = { high: 'danger', medium: 'warning', low: 'neutral' } as const

export function Subjects() {
  const { data, isLoading } = useSubjects()
  const remove = useDeleteSubject()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState<Subject | null>(null)

  const items = data?.items ?? []

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Subjects"
        subtitle={items.length > 0 ? `${items.length} ${items.length === 1 ? 'subject' : 'subjects'} in your workspace` : 'The building blocks of your plan'}
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus />
            New subject
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[186px] rounded-card" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <Card>
          <EmptyState
            icon={<BookOpen />}
            title="Your study workspace starts with a subject"
            description="Add the subjects you are studying, then the tasks and deadlines inside them."
            action={
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus />
                Add subject
              </Button>
            }
          />
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((subject, index) => {
          const goal = subject.weeklyTargetMinutes
          const value = goal ? percent(subject.stats.studiedWeekMinutes, goal) : 0
          return (
            <motion.div key={subject.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.04 }}>
              <Card className="flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-10 place-items-center rounded-[11px]" style={{ background: `color-mix(in srgb, ${subject.color} 14%, var(--color-surface))`, color: subject.color }}>
                    <BookOpen className="size-5" />
                  </span>
                  <Menu
                    trigger={
                      <button type="button" aria-label={`Actions for ${subject.name}`} className="grid size-8 place-items-center rounded-tile text-faint hover:bg-surface-2 hover:text-fg">
                        <Ellipsis className="size-4" />
                      </button>
                    }
                    items={[
                      { label: 'Edit subject', icon: <Pencil />, onSelect: () => setEditing(subject) },
                      { label: 'Delete subject', icon: <Trash />, danger: true, onSelect: () => setDeleting(subject) },
                    ]}
                  />
                </div>

                <Link to={`/subjects/${subject.id}`} className="mt-3 block">
                  <h3 className="truncate text-[16px] font-semibold tracking-tight hover:text-accent">{subject.name}</h3>
                </Link>
                <p className="mt-1 line-clamp-2 min-h-[32px] text-[12.5px] leading-relaxed text-muted">{subject.description || 'No description yet.'}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={priorityTone[subject.priority]}>{subject.priority}</Badge>
                  <Badge tone="neutral">Difficulty {subject.difficulty}/5</Badge>
                  {subject.stats.nextAssessmentAt && (
                    <Badge tone="warning">
                      <CalendarDays className="size-3" />
                      {dateLabel(new Date(subject.stats.nextAssessmentAt).toISOString().slice(0, 10), { month: 'short', day: 'numeric' })}
                    </Badge>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-faint">
                      {goal ? `${minutesLabel(subject.stats.studiedWeekMinutes)} of ${minutesLabel(goal)} this week` : `${minutesLabel(subject.stats.studiedWeekMinutes)} studied this week`}
                    </span>
                    {goal && <span className="tabular font-medium">{value}%</span>}
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${goal ? Math.min(100, value) : 0}%`, background: subject.color }} />
                  </div>
                  <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-faint">
                    <span>{subject.stats.openTasks} open</span>
                    <span>{subject.stats.topics} topics</span>
                    <span>{minutesLabel(subject.stats.plannedWeekMinutes)} planned</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
        {!isLoading && items.length > 0 && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-[186px] flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line-strong text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="size-5" />
            <span className="text-[13.5px] font-medium">New subject</span>
          </button>
        )}
      </div>

      <SubjectDialog open={creating} onClose={() => setCreating(false)} />
      <SubjectDialog open={Boolean(editing)} onClose={() => setEditing(null)} subject={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast('Subject removed')
              setDeleting(null)
            },
          })
        }
        loading={remove.isPending}
        title={deleting ? `Delete ${deleting.name}?` : 'Delete subject?'}
        description="Its tasks, topics, assessments and upcoming sessions are removed. Completed study sessions stay in your history and analytics."
      />
    </div>
  )
}
