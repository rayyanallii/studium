import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Send, Trash2, X } from 'lucide-react'
import { api, useMe } from '../lib/api'
import { Alert, Button, ConfirmDialog, Dialog, Textarea } from './ui'
import type { AssistantAction, AssistantMessage } from '../../shared/assistant'

export function AssistantIcon({ className = 'size-9' }: { className?: string }) {
  return <img src="/images/study-icons/ai-chatbot-3d.png" alt="" aria-hidden="true" width={1254} height={1254} className={`shrink-0 object-contain ${className}`} draggable={false} />
}

const starters = ['What should I study next?', 'Help me catch up on overdue tasks', 'Explain something from my study materials']

export function AssistantChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const client = useQueryClient(), { data: me } = useMe()
  const [draft, setDraft] = useState(''), [clearOpen, setClearOpen] = useState(false)
  const bottom = useRef<HTMLDivElement>(null), input = useRef<HTMLTextAreaElement>(null)
  const history = useQuery({ queryKey: ['assistant'], queryFn: () => api<{ messages: AssistantMessage[]; available: boolean }>('/assistant/messages'), enabled: open, retry: false })
  const send = useMutation({
    mutationFn: (message: string) => api('/assistant/messages', { method: 'POST', json: { message } }),
    onSuccess: async () => { setDraft(''); await client.invalidateQueries({ queryKey: ['assistant'] }); input.current?.focus() },
  })
  const act = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'apply' | 'dismiss' }) => api(`/assistant/actions/${id}/${decision}`, { method: 'POST' }),
    onSettled: () => client.invalidateQueries(),
  })
  const clear = useMutation({ mutationFn: () => api('/assistant/messages', { method: 'DELETE' }), onSuccess: async () => { setClearOpen(false); send.reset(); act.reset(); await client.invalidateQueries({ queryKey: ['assistant'] }) } })
  const messages = history.data?.messages ?? []
  const unavailable = history.data?.available === false
  const busy = send.isPending || act.isPending || clear.isPending
  useEffect(() => { if (open) bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [open, messages.length, send.isPending])
  const submit = () => { if (draft.trim() && !busy && !unavailable && !history.isError) { act.reset(); send.mutate(draft.trim()) } }

  return <>
    <Dialog open={open} onClose={onClose} title="Studium Assistant" description="Ask, learn, and manage your workspace." width={720} footer={
      <div className="w-full">
        <form onSubmit={event => { event.preventDefault(); submit() }} className="flex items-end gap-3">
          <Textarea ref={input} aria-label="Message Studium Assistant" placeholder="Ask about your studies or request a change…" value={draft} maxLength={4000} disabled={busy || unavailable} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit() } }} className="min-h-[80px] flex-1 resize-none" rows={2} />
          <Button variant="primary" size="icon" type="submit" aria-label="Send message" loading={send.isPending} disabled={!draft.trim() || busy || unavailable || history.isError}><Send /></Button>
        </form>
        <p className="mt-2 text-xs leading-5 text-faint">Relevant workspace data is shared with the study AI. Review suggested changes before applying them.</p>
      </div>
    }>
      <div className="flex min-h-[200px] flex-col gap-5 sm:min-h-[300px]">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2"><AssistantIcon /><span className="text-sm text-muted">Your personal study assistant</span></div>
          {messages.length > 0 && <Button size="icon-sm" variant="ghost" aria-label="Clear conversation" disabled={busy} onClick={() => setClearOpen(true)}><Trash2 /></Button>}
        </div>
        {history.isPending && <p role="status" className="text-sm text-muted">Loading your conversation…</p>}
        {history.error && <Alert tone="danger" action={<Button size="sm" onClick={() => void history.refetch()}>Retry</Button>}>Could not load the conversation. {history.error.message}</Alert>}
        {unavailable && <Alert tone="info">The AI connection is not configured yet. Your workspace is still available as usual.</Alert>}
        {!history.isPending && !history.isError && !messages.length && <div className="py-3 text-center">
          <AssistantIcon className="mx-auto size-24" />
          <h3 className="mt-3 text-lg font-semibold">A little help with your next step.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">I can work with your subjects, tasks, schedule, progress, and study materials.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">{starters.map(text => <button key={text} disabled={unavailable} className="rounded-control border border-line px-3 py-2 text-sm text-muted hover:bg-surface-2 disabled:opacity-50" onClick={() => { setDraft(text); input.current?.focus() }}>{text}</button>)}</div>
        </div>}
        <div role="log" aria-label="Conversation" aria-live="polite" className="space-y-5">
          {messages.map(message => <div key={message.id} className={message.role === 'user' ? 'ml-5 rounded-[16px] bg-surface-2 p-4 sm:ml-16' : 'mr-2'}>
            <p className="mb-2 text-xs font-medium text-faint">{message.role === 'user' ? 'You' : 'Studium Assistant'}</p>
            <p className="whitespace-pre-wrap break-words text-[15px] leading-7">{message.content}</p>
            {message.actions.map(action => <ActionCard key={action.id} action={action} timezone={me?.profile.timezone ?? 'UTC'} busy={busy} onDecide={decision => act.mutate({ id: action.id, decision })} />)}
          </div>)}
          {send.isPending && <><div className="ml-5 rounded-[16px] bg-surface-2 p-4 sm:ml-16"><p className="mb-2 text-xs text-faint">You</p><p className="whitespace-pre-wrap break-words text-[15px] leading-7">{send.variables}</p></div><p role="status" className="flex items-center gap-2 text-sm text-muted"><AssistantIcon className="size-8" />Checking your workspace…</p></>}
        </div>
        {(send.error || act.error || clear.error) && <Alert tone="danger">{send.error?.message || act.error?.message || clear.error?.message}</Alert>}
        <div ref={bottom} />
      </div>
    </Dialog>
    <ConfirmDialog open={clearOpen} onClose={() => setClearOpen(false)} title="Clear this conversation?" description="Messages and pending suggestions will be removed. Changes you already applied to your workspace will stay." loading={clear.isPending} onConfirm={() => clear.mutate()} />
  </>
}

function ActionCard({ action, timezone, busy, onDecide }: { action: AssistantAction; timezone: string; busy: boolean; onDecide: (decision: 'apply' | 'dismiss') => void }) {
  const details = Object.entries(action.body).filter(([key]) => !key.toLowerCase().endsWith('id') && !key.toLowerCase().endsWith('ids') && key !== 'requestId')
  const display = (key: string, value: unknown): string => {
    if (typeof value === 'number' && ['startsAt', 'endsAt', 'dueAt'].includes(key)) {
      if (!Number.isFinite(new Date(value).getTime())) return 'Invalid date'
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(value)
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (value === null) return 'None'
    if (Array.isArray(value)) return value.map(item => item && typeof item === 'object' ? Object.entries(item).map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${v}`).join(' · ') : String(item)).join('\n')
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
  return <section className="mt-4 rounded-[14px] border border-line bg-panel p-4">
    <h4 className="font-medium">{action.title}</h4><p className="mt-1 text-sm leading-6 text-muted">{action.description}</p>
    {details.length > 0 && <dl className="mt-3 space-y-2 border-t border-line pt-3 text-sm">{details.map(([key, value]) => <div key={key} className="flex flex-wrap gap-x-3 gap-y-1"><dt className="capitalize text-faint">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="min-w-0 whitespace-pre-wrap break-words">{display(key, value)}</dd></div>)}</dl>}
    {action.status === 'pending' ? <div className="mt-4 flex gap-2"><Button size="sm" variant={action.method === 'DELETE' ? 'danger' : 'primary'} disabled={busy} onClick={() => onDecide('apply')}>{action.method === 'DELETE' ? 'Confirm deletion' : 'Apply change'}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => onDecide('dismiss')}>Dismiss</Button></div> : <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted">{action.status === 'applied' ? <Check className="size-4 text-success" /> : action.status === 'failed' ? <X className="size-4 text-danger" /> : null}{action.status === 'applied' ? 'Applied to your workspace' : action.status === 'failed' ? action.error || 'Could not apply this change' : action.status === 'applying' ? 'Applying change…' : 'Dismissed'}</p>}
  </section>
}
