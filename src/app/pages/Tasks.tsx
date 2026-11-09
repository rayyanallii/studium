import { ListChecks, Plus, Search, TriangleExclamationPoint } from 'lucide-react'
import { useState } from 'react'

import type { Task } from '../../shared/types'
import { TaskDialog } from '../components/TaskDialog'
import { TaskRow } from '../components/TaskRow'
import { Button, Card, EmptyState, PageHeader, Segmented, Select, Skeleton } from '../components/ui'
import { useMe, useSubjects, useTasks, type TaskFilters } from '../lib/api'

const FILTERS: { value: NonNullable<TaskFilters['filter']>; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
]

export function Tasks() {
  const { data: me } = useMe()
  const { data: subjects } = useSubjects()
  const timezone = me?.profile.timezone ?? 'UTC'
  const [filter, setFilter] = useState<NonNullable<TaskFilters['filter']>>('all')
  const [subjectId, setSubjectId] = useState('')
  const [priority, setPriority] = useState('')
  const [sort, setSort] = useState<NonNullable<TaskFilters['sort']>>('due')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [creating, setCreating] = useState(false)

  const { data, isLoading } = useTasks({ filter, subjectId: subjectId || undefined, priority: priority || undefined, sort })
  const items = (data?.items ?? []).filter((task) => (search ? task.title.toLowerCase().includes(search.toLowerCase()) : true))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tasks"
        subtitle={data ? `${data.counts.open} open · ${data.counts.overdue} overdue · ${data.counts.completed} completed` : 'Everything the plan can schedule'}
        actions={
          <Button variant="primary" onClick={() => setCreating(true)} disabled={(subjects?.items ?? []).length === 0}>
            <Plus />
            New task
          </Button>
        }
      />

      <div className="flex flex-col gap-2">
        <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-1">
          <Segmented value={filter} onChange={setFilter} options={FILTERS} />
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="h-9 w-full rounded-control border border-line-strong bg-panel pl-9 pr-3 text-[15px] placeholder:text-faint focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15"
            />
          </label>
          <Select value={subjectId} onValueChange={(value) => setSubjectId(value)} className="sm:w-[168px]" aria-label="Filter by subject">
            <option value="">All subjects</option>
            {(subjects?.items ?? []).map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Select value={priority} onValueChange={(value) => setPriority(value)} className="flex-1 sm:w-[128px]" aria-label="Filter by priority">
              <option value="">Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as NonNullable<TaskFilters['sort']>)} className="flex-1 sm:w-[140px]" aria-label="Sort tasks">
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
              <option value="created">Newest</option>
            </Select>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading && (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <EmptyState
            icon={filter === 'overdue' ? <TriangleExclamationPoint /> : <ListChecks />}
            title={search ? 'No tasks match that search' : filter === 'today' ? 'Nothing due today' : filter === 'overdue' ? 'Nothing overdue' : filter === 'completed' ? 'No completed tasks yet' : "You're all caught up"}
            description={
              search
                ? 'Try a different word or clear the filters.'
                : filter === 'all'
                  ? 'Add the concrete pieces of work you need to get through. The planner will fit them into your week.'
                  : 'Nothing here right now.'
            }
            action={
              filter === 'all' && !search ? (
                <Button variant="primary" onClick={() => setCreating(true)} disabled={(subjects?.items ?? []).length === 0}>
                  <Plus />
                  Add task
                </Button>
              ) : undefined
            }
          />
        )}

        {!isLoading &&
          items.map((task) => <TaskRow key={task.id} task={task} timezone={timezone} onEdit={setEditing} />)}
      </Card>

      <TaskDialog open={creating} onClose={() => setCreating(false)} defaultSubjectId={subjectId || undefined} />
      <TaskDialog open={Boolean(editing)} onClose={() => setEditing(null)} task={editing} />
    </div>
  )
}
