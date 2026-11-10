import { Plus, Trash } from 'lucide-react'

import { WEEKDAYS } from '../../shared/types'
import { TimeInput } from './fields'
import { Button } from './ui'

export interface DraftWindow {
  weekday: number
  startLocalTime: string
  endLocalTime: string
}

/** Controlled weekly availability editor. Weekdays are 1 (Mon) … 7 (Sun). */
export function AvailabilityEditor({ rules, onChange }: { rules: DraftWindow[]; onChange: (rules: DraftWindow[]) => void }) {
  const add = (weekday: number) => {
    const existing = rules.filter((rule) => rule.weekday === weekday)
    const last = existing[existing.length - 1]
    const start = last ? last.endLocalTime : '17:00'
    const end = last ? addMinutes(last.endLocalTime, 120) : '19:00'
    onChange([...rules, { weekday, startLocalTime: start, endLocalTime: end }].sort((a, b) => a.weekday - b.weekday || a.startLocalTime.localeCompare(b.startLocalTime)))
  }

  const update = (index: number, patch: Partial<DraftWindow>) => onChange(rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)))

  const remove = (index: number) => onChange(rules.filter((_, i) => i !== index))

  return (
    <div className="@container flex flex-col gap-3">
      {WEEKDAYS.map((label, index) => {
        const weekday = index + 1
        const windows = rules.map((rule, i) => ({ rule, i })).filter(({ rule }) => rule.weekday === weekday)
        return (
          <div key={label} className="grid min-w-0 gap-4 rounded-card border border-line p-4 @[760px]:grid-cols-[120px_minmax(0,1fr)_auto] @[760px]:items-start">
            <div className="flex items-center justify-between gap-2 @[760px]:pt-8">
              <p className="text-[15px] font-medium">{label}</p>
            </div>
            {windows.length === 0 ? (
              <p className="text-[14px] text-faint @[760px]:pt-8">Unavailable</p>
            ) : (
              <div className="flex min-w-0 flex-col gap-4">
                {windows.map(({ rule, i }, windowIndex) => {
                  const invalid = rule.endLocalTime <= rule.startLocalTime
                  return (
                    <div key={i} className="grid min-w-0 grid-cols-[minmax(0,1fr)_32px] items-end gap-3 @[540px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px]">
                      <div className="col-start-1 grid min-w-0 gap-2">
                        <p className="text-[13px] font-medium text-muted">Start time</p>
                        <TimeInput label={`${label} window ${windowIndex + 1} start time`} value={rule.startLocalTime} onValueChange={(value) => update(i, { startLocalTime: value })} />
                      </div>
                      <div className="col-start-1 grid min-w-0 gap-2 @[540px]:col-start-2">
                        <p className="text-[13px] font-medium text-muted">End time</p>
                        <TimeInput label={`${label} window ${windowIndex + 1} end time`} value={rule.endLocalTime} onValueChange={(value) => update(i, { endLocalTime: value })} />
                      </div>
                      <Button size="icon-sm" variant="ghost" className="mb-1" aria-label={`Remove ${label} window ${windowIndex + 1}`} onClick={() => remove(i)}>
                        <Trash />
                      </Button>
                      {invalid && <span className="col-span-full text-[14px] text-danger">Ends before it starts</span>}
                    </div>
                  )
                })}
              </div>
            )}
            <Button size="sm" variant="ghost" className="justify-self-start @[760px]:mt-7" aria-label={`Add ${label} window`} onClick={() => add(weekday)}>
              <Plus />
              Add window
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = Math.min(23 * 60 + 59, (hours || 0) * 60 + (mins || 0) + minutes)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

