import { DatePicker, NumberField } from 'frosted-ui'
import { parseDate, type CalendarDate } from '@internationalized/date'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cx } from '../lib/cx'
import { Input, Select, Textarea, useFieldId } from './ui'

/** Text fields, wrapped once so every form shares the same id and spacing. */
export function FieldInput(props: ComponentPropsWithoutRef<typeof Input>) {
  const id = useFieldId()
  return <Input id={id} {...props} />
}

export function FieldTextarea(props: ComponentPropsWithoutRef<typeof Textarea>) {
  const id = useFieldId()
  return <Textarea id={id} {...props} />
}

/**
 * Numeric field with Frosted UI stepper buttons. It renders a text input, so the
 * browser's native number spinner never appears.
 */
export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  step = 5,
  placeholder,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  const id = useFieldId()
  const numeric = value === '' ? null : Number(value)
  return (
    <NumberField.Root
      size="3"
      value={numeric === null || Number.isNaN(numeric) ? null : numeric}
      onValueChange={(next) => onValueChange(next == null ? '' : String(next))}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cx('w-full min-w-0', className)}
    >
      <NumberField.Input id={id} placeholder={placeholder} aria-label={ariaLabel} />
    </NumberField.Root>
  )
}

/** Calendar triggered from a normal field row; no native date picker involved. */
export function DateInput({
  value,
  onValueChange,
  min,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  min?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  const id = useFieldId()
  return (
    <DatePicker<CalendarDate>
      size="3"
      value={parse(value)}
      minValue={parse(min) ?? undefined}
      onChange={(next) => onValueChange(next ? next.toString() : '')}
      isDisabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : `${id}-label`}
      className={cx('w-full min-w-0', className)}
    />
  )
}

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))

/**
 * Time is two Frosted UI selects rather than an `<input type="time">`, so it
 * matches the rest of the field set and drops the native clock button.
 */
export function TimeInput({
  value,
  onValueChange,
  label = 'Time',
  disabled,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  label?: string
  disabled?: boolean
  className?: string
}) {
  const [rawHour = '', rawMinute = ''] = value.split(':')
  const hour = HOURS.includes(rawHour) ? rawHour : HOURS[9]
  const minute = MINUTES.includes(rawMinute) ? rawMinute : MINUTES[0]
  const minutes = MINUTES.includes(rawMinute) ? MINUTES : [...MINUTES, rawMinute].sort()

  return (
    <div className={cx('flex min-w-0 items-center gap-2', className)}>
      <div className="w-[76px] shrink-0">
        <Select value={hour} onValueChange={(next) => onValueChange(`${next}:${minute}`)} disabled={disabled} aria-label={`${label} hour`}>
          {HOURS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
      <span aria-hidden className="text-[15px] text-faint">
        :
      </span>
      <div className="w-[76px] shrink-0">
        <Select value={minute} onValueChange={(next) => onValueChange(`${hour}:${next}`)} disabled={disabled} aria-label={`${label} minutes`}>
          {minutes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

/** Radio option drawn with Frosted tokens instead of the browser's own dot. */
export function Choice({
  checked,
  disabled,
  onChange,
  tone = 'default',
  children,
}: {
  checked: boolean
  disabled?: boolean
  onChange: () => void
  tone?: 'default' | 'correct' | 'wrong'
  children: ReactNode
}) {
  const surface =
    tone === 'correct'
      ? 'border-success/50 bg-success-soft'
      : tone === 'wrong'
        ? 'border-danger/50 bg-danger-soft'
        : checked
          ? 'border-accent bg-accent-soft'
          : 'border-line hover:bg-surface-2'
  return (
    <label
      className={cx(
        'flex items-start gap-3 rounded-control border px-4 py-3 text-[15px] leading-relaxed transition-colors',
        surface,
        disabled ? 'cursor-default' : 'cursor-pointer',
      )}
    >
      <input type="radio" className="peer sr-only" checked={checked} disabled={disabled} onChange={onChange} />
      <span
        aria-hidden
        className="mt-1 grid size-4 shrink-0 place-items-center rounded-full border border-line-strong bg-panel transition-colors peer-checked:border-accent peer-focus-visible:ring-[3px] peer-focus-visible:ring-accent/25"
      >
        <span className={cx('size-2 rounded-full bg-accent transition-transform duration-150', checked ? 'scale-100' : 'scale-0')} />
      </span>
      <span>{children}</span>
    </label>
  )
}

function parse(value: string | undefined): CalendarDate | null {
  if (!value) return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}
