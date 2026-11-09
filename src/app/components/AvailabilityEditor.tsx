import { Plus, Trash } from 'lucide-react'

import { WEEKDAYS } from '../../shared/types'
import { cx } from '../lib/cx'
import { Button, Input } from './ui'

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
    <div className="flex flex-col gap-2">
      {WEEKDAYS.map((label, index) => {
        const weekday = index + 1
        const windows = rules.map((rule, i) => ({ rule, i })).filter(({ rule }) => rule.weekday === weekday)
        return (
          <div key={label} className="rounded-card border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[15px] font-medium">{label}</p>
              <Button size="sm" variant="ghost" onClick={() => add(weekday)}>
                <Plus />
                Add window
              </Button>
            </div>
            {windows.length === 0 ? (
              <p className="mt-1 text-[14px] text-faint">Unavailable</p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {windows.map(({ rule, i }) => {
                  const invalid = rule.endLocalTime <= rule.startLocalTime
                  return (
                    <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_32px] items-center gap-2 sm:flex">
                      <Input
                        type="time"
                        aria-label={`${label} start time`}
                        value={rule.startLocalTime}
                        onChange={(event) => update(i, { startLocalTime: event.target.value })}
                        className={cx('min-w-0 sm:w-[130px]', invalid && 'border-danger')}
                      />
                      <span className="text-[14px] text-faint">to</span>
                      <Input
                        type="time"
                        aria-label={`${label} end time`}
                        value={rule.endLocalTime}
                        onChange={(event) => update(i, { endLocalTime: event.target.value })}
                        className={cx('min-w-0 sm:w-[130px]', invalid && 'border-danger')}
                      />
                      <Button size="icon-sm" variant="ghost" aria-label={`Remove ${label} window`} onClick={() => remove(i)}>
                        <Trash />
                      </Button>
                      {invalid && <span className="col-span-4 text-[14px] text-danger">Ends before it starts</span>}
                    </div>
                  )
                })}
              </div>
            )}
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
