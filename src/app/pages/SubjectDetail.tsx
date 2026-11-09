import { ArrowLeft, BookOpen, CalendarDays, Check, Pencil, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import type { Topic } from '../../shared/types'
import { AssessmentDialog } from '../components/AssessmentDialog'
import { SessionCard } from '../components/SessionCard'
import { SubjectDialog } from '../components/SubjectDialog'
import { TaskDialog } from '../components/TaskDialog'
import { TaskRow } from '../components/TaskRow'
import { Alert, Badge, Button, Card, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, Skeleton, Textarea, useFieldId, useToast } from '../components/ui'
import { useAssessments, useDeleteTopic, useMe, useSaveTopic, useSubject, useSubjectAnalytics, useTasks } from '../lib/api'
import { cx } from '../lib/cx'
import { dateLabel, minutesLabel, untilLabel } from '../lib/format'

function FieldInput(props: React.ComponentPropsWithoutRef<typeof Input>) {
  const id = useFieldId()
  return <Input id={id} {...props} />
}
function FieldTextarea(props: React.ComponentPropsWithoutRef<typeof Textarea>) {
  const id = useFieldId()
  return <Textarea id={id} {...props} />
}

export function SubjectDetail() {
  const { id } = useParams()
  const { data: me } = useMe()
  const timezone = me?.profile.timezone ?? 'UTC'
  const { data, isLoading } = useSubject(id)
  const { data: taskData } = useTasks({ subjectId: id })
  const { data: assessmentData } = useAssessments()
  const { data: analytics } = useSubjectAnalytics(id)
  const deleteTopic = useDeleteTopic()
  const toast = useToast()

  const [editSubject, setEditSubject] = useState(false)
  const [addTask, setAddTask] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [addAssessment, setAddAssessment] = useState(false)
  const [topicDialog, setTopicDialog] = useState<{ topic?: Topic } | null>(null)
  const [removeTopic, setRemoveTopic] = useState<Topic | null>(null)

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[160px] rounded-card" />
        <Skeleton className="h-[240px] rounded-card" />
      </div>
    )
  }

  const { subject, topics } = data
  const tasks = taskData?.items ?? []
  const assessments = (assessmentData?.items ?? []).filter((assessment) => assessment.subjectId === subject.id)
  const openTasks = tasks.filter((task) => task.status === 'todo' || task.status === 'in_progress')
  const doneTasks = tasks.filter((task) => task.status === 'completed')

  return (
    <div className="flex flex-col gap-6">
      <Link to="/subjects" className="inline-flex w-fit items-center gap-1.5 text-[15px] text-muted hover:text-fg">
        <ArrowLeft className="size-4" />
        Subjects
      </Link>

      <PageHeader
        title={subject.name}
        subtitle={subject.description ?? 'No description yet.'}
        actions={
          <>
            <Button onClick={() => setEditSubject(true)}>
              <Pencil />
              Edit
            </Button>
            <Button variant="primary" onClick={() => setAddTask(true)}>
              <Plus />
              Add task
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={subject.priority === 'high' ? 'danger' : subject.priority === 'medium' ? 'warning' : 'neutral'}>{subject.priority} priority</Badge>
        <Badge tone="neutral">Difficulty {subject.difficulty}/5</Badge>
        {subject.weeklyTargetMinutes && <Badge tone="accent">{minutesLabel(subject.weeklyTargetMinutes)} weekly target</Badge>}
        <span className="inline-flex items-center gap-1.5 text-[14px] text-faint">
          <span className="round size-2 rounded-full" style={{ background: subject.color }} />
          Subject colour
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Studied this week', value: minutesLabel(subject.stats.studiedWeekMinutes) },
          { label: 'Planned this week', value: minutesLabel(subject.stats.plannedWeekMinutes) },
          { label: 'Last 30 days', value: minutesLabel(analytics?.totals.minutes ?? 0) },
          { label: 'Open tasks', value: String(openTasks.length) },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-[13px] text-faint">{stat.label}</p>
            <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[14px] font-semibold">Tasks</h2>
            <Button size="sm" onClick={() => setAddTask(true)}>
              <Plus />
              Add
            </Button>
          </div>
          {openTasks.length === 0 && doneTasks.length === 0 ? (
            <EmptyState icon={<Check />} title="No tasks yet" description="Add the work you need to get through for this subject." />
          ) : (
            <div>
              {[...openTasks, ...doneTasks].map((task) => (
                <TaskRow key={task.id} task={task} timezone={timezone} showSubject={false} onEdit={(value) => setEditTaskId(value.id)} />
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Assessments</h2>
              <Button size="sm" variant="ghost" onClick={() => setAddAssessment(true)}>
                <Plus />
                Add
              </Button>
            </div>
            {assessments.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">No exams or deadlines yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {assessments.map((assessment) => (
                  <li key={assessment.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">{assessment.title}</span>
                      <span className="block text-[13px] text-faint">{dateLabel(new Date(assessment.dueAt).toISOString().slice(0, 10), { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </span>
                    <Badge tone={assessment.dueAt < Date.now() ? 'neutral' : 'warning'}>{untilLabel(assessment.dueAt)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Topics</h2>
              <Button size="sm" variant="ghost" onClick={() => setTopicDialog({})}>
                <Plus />
                Add
              </Button>
            </div>
            {topics.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">Break the subject into topics to keep tasks focused.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1.5">
                {topics.map((topic) => (
                  <li key={topic.id} className="group flex items-center gap-2 rounded-tile px-1 py-1.5 hover:bg-surface-2">
                    <span className={cx('round size-2 shrink-0 rounded-full', topic.status === 'completed' ? 'bg-success' : topic.status === 'in_progress' ? 'bg-warning' : 'bg-raised')} />
                    <button type="button" onClick={() => setTopicDialog({ topic })} className="min-w-0 flex-1 text-left">
                      <span className={cx('block truncate text-[15px]', topic.status === 'completed' && 'text-muted line-through')}>{topic.name}</span>
                      {topic.estimatedMinutes ? <span className="block text-[11px] text-faint">{minutesLabel(topic.estimatedMinutes)}</span> : null}
                    </button>
                    <button type="button" aria-label={`Delete ${topic.name}`} onClick={() => setRemoveTopic(topic)} className="text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100">
                      <Trash className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Recent sessions</h2>
          <span className="text-[14px] text-faint">{analytics?.totals.completed ?? 0} completed in 30 days</span>
        </div>
        {analytics && analytics.recent.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            {analytics.recent.map((session) => (
              <SessionCard key={session.id} session={session} timezone={timezone} compact />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">No study sessions recorded for this subject yet.</p>
        )}
      </Card>

      <SubjectDialog open={editSubject} onClose={() => setEditSubject(false)} subject={subject} />
      <TaskDialog open={addTask} onClose={() => setAddTask(false)} defaultSubjectId={subject.id} />
      <TaskDialog open={Boolean(editTaskId)} onClose={() => setEditTaskId(null)} task={tasks.find((task) => task.id === editTaskId) ?? null} />
      <AssessmentDialog open={addAssessment} onClose={() => setAddAssessment(false)} defaultSubjectId={subject.id} />
      <TopicDialog open={Boolean(topicDialog)} onClose={() => setTopicDialog(null)} subjectId={subject.id} topic={topicDialog?.topic} />
      <ConfirmDialog
        open={Boolean(removeTopic)}
        onClose={() => setRemoveTopic(null)}
        onConfirm={() =>
          removeTopic &&
          deleteTopic.mutate(removeTopic.id, {
            onSuccess: () => {
              toast('Topic removed')
              setRemoveTopic(null)
            },
          })
        }
        loading={deleteTopic.isPending}
        title={removeTopic ? `Delete “${removeTopic.name}”?` : 'Delete topic?'}
        description="Tasks linked to this topic stay, but they lose the topic link."
      />
    </div>
  )
}

function TopicDialog({ open, onClose, subjectId, topic }: { open: boolean; onClose: () => void; subjectId: string; topic?: Topic }) {
  const save = useSaveTopic()
  const toast = useToast()
  const [loadedFor, setLoadedFor] = useState<string | null>(topic?.id ?? 'new')
  const [form, setForm] = useState({
    name: topic?.name ?? '',
    description: topic?.description ?? '',
    estimatedMinutes: topic?.estimatedMinutes ? String(topic.estimatedMinutes) : '60',
    status: topic?.status ?? 'not_started',
  })

  if (open && (topic?.id ?? 'new') !== loadedFor) {
    setForm({
      name: topic?.name ?? '',
      description: topic?.description ?? '',
      estimatedMinutes: topic?.estimatedMinutes ? String(topic.estimatedMinutes) : '60',
      status: topic?.status ?? 'not_started',
    })
    setLoadedFor(topic?.id ?? 'new')
  }

  const submit = () => {
    save.mutate(
      {
        subjectId,
        id: topic?.id,
        values: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          estimatedMinutes: Number(form.estimatedMinutes) || null,
          status: form.status as Topic['status'],
        },
      },
      {
        onSuccess: () => {
          toast(topic ? 'Topic updated' : 'Topic added')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={topic ? 'Edit topic' : 'New topic'}
      width={460}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={save.isPending} disabled={!form.name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Topic name">
          <FieldInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Integration techniques" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estimate" hint="Minutes">
            <FieldInput type="number" min={0} max={3000} step={10} value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: event.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as Topic['status'] })}>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </Select>
          </Field>
        </div>
        <Field label="Notes" hint="Optional.">
          <FieldTextarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-[64px]" />
        </Field>
        {save.error && <Alert tone="danger">{save.error.message}</Alert>}
      </div>
    </Dialog>
  )
}

export const SUBJECT_ICON = BookOpen
export const ASSESSMENT_ICON = CalendarDays
