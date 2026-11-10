import { Button as FrostButton, TextField, TextArea, Select as FrostSelect, Checkbox as FrostCheckbox, Switch as FrostSwitch, Dialog as FrostDialog, DropdownMenu, SegmentedControl } from 'frosted-ui'
import { AnimatePresence, motion } from 'motion/react'
import { LoaderCircle, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  Children,
  isValidElement,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'

import { cx } from '../lib/cx'
import { initials } from '../lib/format'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm' | 'icon' | 'icon-sm'
export function Button({ variant = 'secondary', size = 'md', className, loading, children, ...rest }: ComponentPropsWithoutRef<'button'> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
  return <FrostButton type="button" {...rest} variant={variant === 'primary' || variant === 'danger' ? 'solid' : variant === 'secondary' ? 'surface' : 'ghost'} color={variant === 'danger' ? 'red' : variant === 'primary' ? 'blue' : 'gray'} size={size === 'sm' || size === 'icon-sm' ? '2' : '3'} disabled={loading || rest.disabled} className={cx('m-0 shrink-0 gap-2 [&_svg]:size-[18px] [&_svg]:shrink-0', size === 'icon' && 'size-10 !p-0', size === 'icon-sm' && 'size-8 !p-0', className)} aria-busy={loading || undefined}>{loading && <LoaderCircle className="animate-spin" />}{children}</FrostButton>
}

export const inputClass =
  'h-9 w-full min-w-0 rounded-control border border-line-strong bg-panel px-3 text-[15px] text-fg placeholder:text-faint transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15 disabled:opacity-60'

export function Input({ className, ...rest }: Omit<ComponentPropsWithoutRef<'input'>, 'size' | 'color'>) {
  const fieldId = useFieldId()
  return <TextField.Root size="3" className={cx('min-w-0 w-full', className)}><TextField.Input id={fieldId} {...rest} size="3" /></TextField.Root>
}

export function Textarea({ className, ...rest }: Omit<ComponentPropsWithoutRef<'textarea'>, 'color'>) {
  const fieldId = useFieldId()
  return <TextArea id={fieldId} className={cx(inputClass, 'h-auto min-h-[88px] resize-y py-2 leading-relaxed', className)} {...rest} />
}

export function Select({ className, children, value, onValueChange, id, name, required, disabled, 'aria-label': ariaLabel }: {
  className?: string; children: ReactNode; value: string | number; onValueChange: (value: string) => void;
  id?: string; name?: string; required?: boolean; disabled?: boolean; 'aria-label'?: string
}) {
  const fieldId = useFieldId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const items = Children.toArray(children).filter(isValidElement).map(child => {
    const props = (child as ReactElement<ComponentPropsWithoutRef<'option'>>).props
    return { value: String(props.value ?? ''), label: props.children, disabled: props.disabled }
  })
  return <FrostSelect.Root value={String(value)} onValueChange={next => { if (next !== null) onValueChange(next) }} name={name} required={required} disabled={disabled} size="3" items={items.map(item => ({ value: item.value, label: String(item.label) }))}>
    <FrostSelect.Trigger ref={triggerRef} id={id ?? fieldId} aria-label={ariaLabel} aria-labelledby={!ariaLabel && fieldId ? `${fieldId}-label` : undefined} className={cx('w-full', className)} />
    <FrostSelect.Content finalFocus={triggerRef}>{items.map(item => <FrostSelect.Item key={item.value} value={item.value} disabled={item.disabled}>{item.label}</FrostSelect.Item>)}</FrostSelect.Content>
  </FrostSelect.Root>
}

export function Checkbox({ className, checked, onChange, label = 'Mark complete' }: { className?: string; checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return <FrostCheckbox checked={checked} onCheckedChange={onChange} className={className} aria-label={label} size="2" />
}

const FieldIdContext = createContext<string | undefined>(undefined)
export const useFieldId = () => useContext(FieldIdContext)

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  const id = useId()
  return (
    <div className={cx('flex min-w-0 flex-col gap-2', className)}>
      <label id={`${id}-label`} htmlFor={id} className="text-[15px] font-medium text-fg">{label}</label>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
      {hint && <span className="text-[14px] text-faint">{hint}</span>}
    </div>
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
    <span className={cx('inline-flex min-h-6 shrink-0 items-center gap-1.5 self-start whitespace-nowrap rounded-tile px-2 py-0.5 text-[14px] font-medium leading-5', toneClasses[tone], className)}>
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
      {description && <p className="mt-1 max-w-sm text-[15px] text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Card({ className, children, ...rest }: ComponentPropsWithoutRef<'section'>) {
  return (
    <section className={cx('min-w-0 rounded-card border border-line bg-panel', className)} {...rest}>
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
    <Card className="flex flex-col gap-4 p-5">
      <p className="flex min-h-5 items-center gap-2 text-[14px] leading-5 text-muted [&_svg]:size-3.5 [&_svg]:shrink-0">
        {icon}
        {label}
      </p>
      <div>
        <p className="text-[22px] font-semibold leading-none tracking-tight tabular">{value}</p>
        {hint && <p className="mt-1.5 text-[14px] text-faint">{hint}</p>}
      </div>
    </Card>
  )
}

export function Segmented<T extends string>({ options, value, onChange, className }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; className?: string }) {
  return <SegmentedControl.Root value={value} onValueChange={next => onChange(next as T)} className={className}><SegmentedControl.List aria-label="View options">{options.map(option => <SegmentedControl.Trigger key={option.value} value={option.value}>{option.label}</SegmentedControl.Trigger>)}</SegmentedControl.List></SegmentedControl.Root>
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return <div className="flex items-center justify-between gap-4"><div><label htmlFor={id} className="font-medium">{label}</label>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div><FrostSwitch id={id} checked={checked} onCheckedChange={onChange} /></div>
}

export function Alert({ tone = 'info', title, children, action }: { tone?: 'info' | 'warning' | 'danger' | 'success'; title?: string; children: ReactNode; action?: ReactNode }) {
  const styles = {
    info: 'border-info/25 bg-info-soft text-info',
    warning: 'border-warning/30 bg-warning-soft text-warning',
    danger: 'border-danger/25 bg-danger-soft text-danger',
    success: 'border-success/25 bg-success-soft text-success',
  } as const
  return (
    <div className={cx('rounded-card border px-4 py-3 text-[15px]', styles[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cx('leading-relaxed', title && 'mt-0.5')}>{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function Dialog({ open, onClose, title, description, children, footer, width = 480 }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; width?: number
}) {
  return <FrostDialog.Root open={open} onOpenChange={next => { if (!next) onClose() }}>
    <FrostDialog.Content style={{ maxWidth: width, width: 'calc(100vw - 32px)' }} className="study-dialog flex max-h-[calc(100dvh-32px)] flex-col overflow-hidden p-0">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6"><div className="min-w-0"><FrostDialog.Title className="m-0 text-[20px] font-semibold leading-7 tracking-[-0.02em]">{title}</FrostDialog.Title>{description && <FrostDialog.Description className="mb-0 mt-2 text-[15px] leading-6 text-muted">{description}</FrostDialog.Description>}</div><FrostDialog.Close><Button size="icon-sm" variant="ghost" aria-label="Close"><X /></Button></FrostDialog.Close></div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line px-5 py-4 sm:px-6">{footer}</div>}
    </FrostDialog.Content>
  </FrostDialog.Root>
}

export function Drawer({ open, onClose, title, children, header, width = 420 }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; header?: ReactNode; width?: number
}) {
  return <Dialog open={open} onClose={onClose} title={title} width={width}>{header}{children}</Dialog>
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
      <p className="text-[15px] leading-relaxed text-muted">{description}</p>
    </Dialog>
  )
}

export function Menu({ trigger, items, align = 'end' }: {
  trigger: ReactElement;
  items: { label: string; onSelect: () => void; danger?: boolean; icon?: ReactNode; disabled?: boolean }[];
  align?: 'start' | 'end'
}) {
  return <DropdownMenu.Root><DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger><DropdownMenu.Content align={align} sideOffset={8} className="min-w-[180px] p-1.5">{items.map(item => <DropdownMenu.Item className="min-h-10 justify-start gap-3 px-3 py-2 [&_svg]:size-[18px] [&_svg]:shrink-0" key={item.label} disabled={item.disabled} onClick={item.onSelect} color={item.danger ? 'red' : undefined}><span className="flex items-center gap-3">{item.icon}{item.label}</span></DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Root>
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
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              role="status"
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={cx(
                'pointer-events-auto max-w-md rounded-control border px-4 py-2.5 text-[15px] font-medium shadow-pop backdrop-blur-xl',
                toast.tone === 'danger' ? 'border-danger/40 bg-danger text-white' : 'border-line bg-raised/95 text-fg',
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
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
      </div>
    </div>
  )
}
