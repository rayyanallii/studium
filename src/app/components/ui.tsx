import { Button as BaseButton } from '@base-ui/react/button'
import { Input as BaseInput } from '@base-ui/react/input'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Toggle } from '@base-ui/react/toggle'
import { Select as BaseSelect } from '@base-ui/react/select'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, LoaderCircle, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  type ReactElement,
  Children,
  isValidElement,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'

import { cx } from '../lib/cx'
import { initials } from '../lib/format'
import { ThemeToggle } from './ThemeProvider'

// Buttons, inputs and selects share one height per size so controls that sit
// beside each other line up: md = 36px, sm = 32px.

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm' | 'icon' | 'icon-sm'

const buttonBase =
  'inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-control font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0'
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-deep',
  secondary: 'border border-line-strong bg-surface text-fg shadow-[0_1px_1px_rgb(20_20_24/0.04)] hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger text-white hover:opacity-90',
}
const buttonSizes: Record<ButtonSize, string> = {
  md: 'h-9 px-3.5 text-[13.5px]',
  sm: 'h-8 px-3 text-[13px]',
  icon: 'size-9',
  'icon-sm': 'size-8',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  loading,
  children,
  ...rest
}: ComponentPropsWithoutRef<'button'> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
  return (
    <BaseButton type="button" {...rest} className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)} disabled={loading || rest.disabled} aria-busy={loading || undefined}>
      {loading && <LoaderCircle className="animate-spin" />}{children}
    </BaseButton>
  )
}

export const inputClass =
  'h-9 w-full min-w-0 rounded-control border border-line-strong bg-surface px-3 text-[13.5px] text-fg placeholder:text-faint transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15 disabled:opacity-60'

export function Input({ className, ...rest }: ComponentPropsWithoutRef<'input'>) {
  const fieldId = useFieldId()
  return <BaseInput id={fieldId} className={cx(inputClass, className)} {...rest} />
}

export function Textarea({ className, ...rest }: ComponentPropsWithoutRef<'textarea'>) {
  return <textarea className={cx(inputClass, 'h-auto min-h-[88px] resize-y py-2 leading-relaxed', className)} {...rest} />
}

export function Select({ className, children, value, onValueChange, id, name, required, disabled, 'aria-label': ariaLabel }: {
  className?: string; children: ReactNode; value: string | number; onValueChange: (value: string) => void;
  id?: string; name?: string; required?: boolean; disabled?: boolean; 'aria-label'?: string
}) {
  const fieldId = useFieldId()
  const items = Children.toArray(children).filter(isValidElement).map(child => {
    const props = (child as ReactElement<ComponentPropsWithoutRef<'option'>>).props
    return { value: String(props.value ?? ''), label: props.children, disabled: props.disabled }
  })
  return (
    <BaseSelect.Root value={String(value)} items={items} onValueChange={next => { if (next !== null) onValueChange(next) }} name={name} required={required} disabled={disabled}>
      <BaseSelect.Trigger id={id ?? fieldId} aria-label={ariaLabel} className={cx(inputClass, 'flex items-center justify-between gap-2 text-left', className)}>
        <BaseSelect.Value className="truncate" /><BaseSelect.Icon><ChevronDown className="size-4 text-muted" /></BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal><BaseSelect.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-[80]">
        <BaseSelect.Popup className="max-h-[min(320px,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-control border border-line-strong bg-surface p-1 shadow-pop">
          <BaseSelect.List>{items.map(item => <BaseSelect.Item key={item.value} value={item.value} disabled={item.disabled} className="flex min-h-9 cursor-default items-center gap-3 rounded-tile px-3 text-[13px] outline-none data-highlighted:bg-surface-2 data-disabled:opacity-40">
            <BaseSelect.ItemText className="flex-1">{item.label}</BaseSelect.ItemText><BaseSelect.ItemIndicator><Check className="size-3.5" /></BaseSelect.ItemIndicator>
          </BaseSelect.Item>)}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner></BaseSelect.Portal>
    </BaseSelect.Root>
  )
}

export function Checkbox({ className, checked, onChange }: { className?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <BaseCheckbox.Root checked={checked} onCheckedChange={onChange} className={cx('grid size-4.5 shrink-0 place-items-center rounded-[4px] border border-line-strong bg-surface data-checked:border-accent data-checked:bg-accent data-checked:text-on-accent', className)}>
    <BaseCheckbox.Indicator><Check className="size-3.5" /></BaseCheckbox.Indicator>
  </BaseCheckbox.Root>
}

const FieldIdContext = createContext<string | undefined>(undefined)
export const useFieldId = () => useContext(FieldIdContext)

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  const id = useId()
  return (
    <label htmlFor={id} className={cx('flex flex-col gap-1.5', className)}>
      <span className="text-[13px] font-medium text-fg">{label}</span>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
      {hint && <span className="text-[12px] text-faint">{hint}</span>}
    </label>
  )
}

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
}

export function Badge({ tone = 'neutral', className, children, dot }: { tone?: Tone; className?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx('inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-tile px-2 text-[12px] font-medium', toneClasses[tone], className)}>
      {dot && <span className="round size-1.5 bg-current" />}
      {children}
    </span>
  )
}

export function Avatar({ name, src, size = 32, className }: { name: string; hue?: number; src?: string | null; size?: number; className?: string }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [src])
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }
  if (src && !broken) {
    return <img src={src} alt="" onError={() => setBroken(true)} className={cx('round shrink-0 rounded-full object-cover', className)} style={style} />
  }
  return (
    <span
      className={cx('round grid shrink-0 place-items-center rounded-full font-semibold text-white', className)}
      style={{ ...style, background: 'var(--color-raised)', color: 'var(--color-fg)' }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cx('size-5 animate-spin text-faint', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-tile bg-raised/70', className)} />
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-4 grid size-12 place-items-center rounded-card bg-surface-2 text-muted [&_svg]:size-5">{icon}</div>}
      <p className="text-[15px] font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13.5px] text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Card({ className, children, ...rest }: ComponentPropsWithoutRef<'section'>) {
  return (
    <section className={cx('rounded-card bg-surface shadow-card', className)} {...rest}>
      {children}
    </section>
  )
}

export function Progress({ value, tone = 'accent', className }: { value: number; tone?: 'accent' | 'success' | 'warning'; className?: string }) {
  const bg = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-accent'
  return (
    <div className={cx('h-1.5 overflow-hidden rounded-full bg-surface-2', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-[width] duration-500 ease-out', bg)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Stat({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return (
    <Card className="flex flex-col justify-between gap-3 p-4">
      <p className="flex items-center gap-1.5 text-[12.5px] text-muted [&_svg]:size-3.5">
        {icon}
        {label}
      </p>
      <div>
        <p className="text-[22px] font-semibold leading-none tracking-tight tabular">{value}</p>
        {hint && <p className="mt-1.5 text-[12px] text-faint">{hint}</p>}
      </div>
    </Card>
  )
}

export function Segmented<T extends string>({ options, value, onChange, className }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; className?: string }) {
  return <ToggleGroup value={[value]} onValueChange={(values) => { if (values.length) onChange(values[0] as T) }} className={cx('inline-flex min-h-9 items-center gap-0.5 rounded-control bg-surface-2 p-1', className)}>
    {options.map(option => <Toggle key={option.value} value={option.value} className="h-7 rounded-[5px] px-3 text-[12.5px] font-medium text-muted transition-colors data-pressed:bg-surface data-pressed:text-fg data-pressed:shadow-card">{option.label}</Toggle>)}
  </ToggleGroup>
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return <div className="flex items-center justify-between gap-4">
    <label htmlFor={id} className="min-w-0 cursor-pointer"><span className="block text-[13.5px] font-medium">{label}</span>{description && <span className="block text-[12.5px] text-muted">{description}</span>}</label>
    <BaseSwitch.Root id={id} checked={checked} onCheckedChange={onChange} className="relative h-6 w-10 shrink-0 rounded-full bg-raised transition-colors data-checked:bg-accent">
      <BaseSwitch.Thumb className="absolute left-0.5 top-0.5 size-5 rounded-full bg-muted transition-transform data-checked:translate-x-4 data-checked:bg-on-accent" />
    </BaseSwitch.Root>
  </div>
}

export function Alert({ tone = 'info', title, children, action }: { tone?: 'info' | 'warning' | 'danger' | 'success'; title?: string; children: ReactNode; action?: ReactNode }) {
  const styles = {
    info: 'border-info/25 bg-info-soft text-info',
    warning: 'border-warning/30 bg-warning-soft text-warning',
    danger: 'border-danger/25 bg-danger-soft text-danger',
    success: 'border-success/25 bg-success-soft text-success',
  } as const
  return (
    <div className={cx('rounded-card border px-4 py-3 text-[13px]', styles[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cx('leading-relaxed', title && 'mt-0.5')}>{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function Dialog({ open, onClose, title, description, children, footer, width = 480 }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; width?: number
}) {
  return <BaseDialog.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/65" />
      <BaseDialog.Popup aria-label={title} className="dialog-popup fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-dialog border border-line-strong bg-surface shadow-dialog" style={{ maxWidth: width }}>
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div><BaseDialog.Title className="text-[18px] font-semibold">{title}</BaseDialog.Title>{description && <BaseDialog.Description className="mt-2 text-[13px] leading-relaxed text-muted">{description}</BaseDialog.Description>}</div>
          <BaseDialog.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}><X /></BaseDialog.Close>
        </header>
        <div className="scrollbar-thin overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface-2/40 px-6 py-4">{footer}</footer>}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  </BaseDialog.Root>
}

export function Drawer({ open, onClose, title, children, header, width = 420 }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; header?: ReactNode; width?: number
}) {
  return <BaseDialog.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/65" />
      <BaseDialog.Popup aria-label={title} className="drawer-popup fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line-strong bg-surface shadow-dialog" style={{ maxWidth: width }}>
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <BaseDialog.Title className={header ? 'sr-only' : 'text-[16px] font-semibold'}>{title}</BaseDialog.Title>
          {header && <div className="min-w-0 flex-1">{header}</div>}
          <BaseDialog.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}><X /></BaseDialog.Close>
        </header>
        <div className="scrollbar-thin flex-1 overflow-y-auto">{children}</div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  </BaseDialog.Root>
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      width={420}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-muted">{description}</p>
    </Dialog>
  )
}

export function Menu({ trigger, items, align = 'end' }: {
  trigger: ReactElement;
  items: { label: string; onSelect: () => void; danger?: boolean; icon?: ReactNode; disabled?: boolean }[];
  align?: 'start' | 'end'
}) {
  return <BaseMenu.Root>
    <BaseMenu.Trigger render={trigger} />
    <BaseMenu.Portal><BaseMenu.Positioner align={align} sideOffset={6} className="z-[70]">
      <BaseMenu.Popup className="min-w-[190px] rounded-card border border-line-strong bg-surface p-1 shadow-pop">
        {items.map(item => <BaseMenu.Item key={item.label} disabled={item.disabled} onClick={(event) => { event.stopPropagation(); item.onSelect() }} className={cx('flex min-h-9 cursor-default items-center gap-2 rounded-tile px-2.5 text-[13px] outline-none data-highlighted:bg-surface-2 data-disabled:opacity-40 [&_svg]:size-4', item.danger ? 'text-danger' : 'text-fg')}>{item.icon}{item.label}</BaseMenu.Item>)}
      </BaseMenu.Popup>
    </BaseMenu.Positioner></BaseMenu.Portal>
  </BaseMenu.Root>
}

type ToastItem = { id: number; message: string; tone: 'neutral' | 'danger' }
const ToastContext = createContext<(message: string, tone?: ToastItem['tone']) => void>(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const push = useCallback((message: string, tone: ToastItem['tone'] = 'neutral') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              role="status"
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={cx(
                'pointer-events-auto max-w-md rounded-control px-4 py-2.5 text-[13.5px] font-medium shadow-pop',
                toast.tone === 'danger' ? 'bg-danger text-white' : 'bg-fg text-bg',
              )}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.035em] sm:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <ThemeToggle className="hidden lg:grid" />
      </div>
    </div>
  )
}
