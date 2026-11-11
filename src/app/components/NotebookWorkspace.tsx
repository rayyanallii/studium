import { lazy, Suspense, useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { StudyMath } from './StudyMath'
import { LearningArtifact } from './LearningArtifact'
import { artifactNotes, artifactPattern } from '../../shared/learning-artifact'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileText, MessageCircle, Network, Plus, Save, Send, StickyNote, Trash2 } from 'lucide-react'
import type { Citation, StudyDetail, StudyMaterial } from '../../shared/study'
import { api } from '../lib/api'
import { useAskNotebook } from '../lib/study-api'
import { Alert, Button, ConfirmDialog, Dialog, Input, Select, Skeleton, Textarea, useToast } from './ui'

const NotebookMap = lazy(() => import('./NotebookMap').then(module => ({ default: module.NotebookMap })))
const NotebookFigures = lazy(() => import('./NotebookFigures').then(module => ({ default: module.NotebookFigures })))
interface Note { id: string; title: string; body: string; version: number }

function InlineText({ text }: { text: string }) {
  return <StudyMath text={text} />
}

/** Render source-grounded prose without accepting HTML from generated text. */
export function NotebookText({ text }: { text: string }) {
  const artifacts = [...text.matchAll(artifactPattern)]
  if (artifacts.length) {
    const parts: ReactNode[] = []; let cursor = 0
    artifacts.forEach((match, index) => { parts.push(<NotebookText key={`text-${index}`} text={text.slice(cursor, match.index)} />, <LearningArtifact key={`artifact-${index}`} json={match[1]} />); cursor = match.index! + match[0].length })
    return <>{parts}<NotebookText text={text.slice(cursor)} /></>
  }
  const labels = /^(Definition|Why it matters|Subtopics|Explanation|Worked examples?|Examples?|Connections|Common misconceptions|Recall questions|Key points|Summary|Overview|Important note)\s*:?\s*(.*)$/i
  return <div className="min-w-0 break-words space-y-3 text-[15px] leading-7 text-muted">{text.replace(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])/g, block => block.replace(/\n/g, ' ')).split('\n').filter(line => line.trim()).map((line, index) => {
    const clean = line.trim()
    const label = clean.replace(/\*\*/g, '').match(labels)
    if (label) return <div key={index} className="pt-2"><h3 className="mb-1 font-semibold text-fg">{label[1]}</h3>{label[2] && <p><InlineText text={label[2]} /></p>}</div>
    if (/^#{1,6}\s/.test(clean)) return <h3 key={index} className="pt-3 font-semibold text-fg"><InlineText text={clean.replace(/^#{1,6}\s+/, '')} /></h3>
    if (/^[-*•]\s/.test(clean)) return <p key={index} className="relative pl-5"><span aria-hidden className="absolute left-1">•</span><InlineText text={clean.replace(/^[-*•]\s+/, '')} /></p>
    return <p key={index}><InlineText text={clean} /></p>
  })}</div>
}

export function NotebookWorkspace({ item, cite, onOpenSource }: { item: StudyDetail; cite: (citation: Citation) => ReactNode; onOpenSource: (source: StudyMaterial) => void }) {
  const [topic, setTopic] = useState(0)
  const [panel, setPanel] = useState<'chat' | 'notes'>('chat')
  const [mapOpen, setMapOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [draft, setDraft] = useState<Note | null>(null)
  const [dirty, setDirty] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [deleting, setDeleting] = useState<Note | null>(null)
  const content = useRef<HTMLDivElement>(null)
  const [split, setSplit] = useState(() => { try { return Math.max(35, Math.min(70, Number(localStorage.getItem('studium-notebook-split')) || 65)) } catch { return 65 } })
  const resize = (value: number) => { const next = Math.max(35, Math.min(70, value)); setSplit(next); try { localStorage.setItem('studium-notebook-split', String(next)) } catch { /* Layout still works without storage. */ } }
  const chatEnd = useRef<HTMLDivElement>(null)
  const chatInput = useRef<HTMLTextAreaElement>(null)
  const toast = useToast(), client = useQueryClient()
  const ask = useAskNotebook(item.id)
  const notesPath = `/notebooks/${item.id}/notes`
  const notes = useQuery({ queryKey: ['notebookNotes', item.id], queryFn: () => api<{ items: Note[] }>(notesPath) })
  const save = useMutation({
    mutationFn: (note: Note) => api(note.id ? `${notesPath}/${note.id}` : notesPath, { method: note.id ? 'PATCH' : 'POST', json: { title: note.title.trim() || 'Untitled note', body: note.body, ...(note.id ? { version: note.version } : {}) } }),
    onSuccess: async () => { setDirty(false); setDraft(null); await client.invalidateQueries({ queryKey: ['notebookNotes', item.id] }); toast('Note saved') },
  })
  const remove = useMutation({ mutationFn: (noteId: string) => api(`${notesPath}/${noteId}`, { method: 'DELETE' }), onSuccess: async () => { setDeleting(null); await client.invalidateQueries({ queryKey: ['notebookNotes', item.id] }) } })
  const sections = item.content.sections ?? []
  const section = sections[topic]

  useEffect(() => {
    const update = () => {
      const selection = window.getSelection()
      if (selection?.rangeCount && content.current?.contains(selection.getRangeAt(0).commonAncestorContainer)) setSelectedText(selection.toString().trim().slice(0, 30000))
      else setSelectedText('')
    }
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => { if (panel === 'chat') chatEnd.current?.parentElement?.scrollTo({ top: chatEnd.current.parentElement.scrollHeight }) }, [item.messages.length, ask.isPending, panel])

  const addToNotes = (text: string) => {
    text = artifactNotes(text)
    if (save.isPending) return toast('Wait for this note to finish saving.')
    if ((draft?.body.length ?? 0) + text.length + 2 > 30000) return toast('This excerpt exceeds the note limit. Save your current note and select a shorter passage.')
    setPanel('notes')
    setDraft(current => current ? { ...current, body: `${current.body}\n\n${text}`.slice(0, 30000) } : { id: '', title: section?.heading ?? 'Study note', body: text.slice(0, 30000), version: 1 })
    setDirty(true)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }
  const send = async (prompt = question) => {
    if (prompt.trim().length < 3 || ask.isPending) return
    setPanel('chat')
    try { await ask.mutateAsync(prompt.trim().slice(0, 1500)); setQuestion('') } catch { /* Keep the draft and show the request error. */ }
  }
  const define = () => {
    const prompt = `Define "${section?.heading}" clearly using this notebook's sources. Explain its meaning, relevant subtopics, and give a supported example.`
    setQuestion(prompt)
    void send(prompt)
  }

  return <div ref={content} style={{ '--notebook-split': `${split}fr`, '--notebook-rest': `${100 - split}fr` } as CSSProperties} className="notebook-columns grid min-w-0 items-start gap-y-4">
    <section className="min-w-0 overflow-hidden rounded-[20px] border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <h2 className="flex items-center gap-2 font-semibold"><BookOpen className="size-4" />Study guide</h2>
        <Button size="sm" onClick={() => setMapOpen(true)}><Network />Mind map</Button>
      </div>
      <details className="border-b border-line px-5 py-3"><summary className="cursor-pointer text-sm font-medium">Sources · {item.sources.length}</summary><div className="mt-3 space-y-1">{item.sources.map(source => <button key={source.id} onClick={() => onOpenSource(source)} className="flex w-full items-start gap-2 rounded-control p-2 text-left text-sm text-muted hover:bg-surface-2"><FileText className="mt-0.5 size-4 shrink-0" /><span className="min-w-0 break-words">{source.title}</span></button>)}</div></details>
      <div className="border-b border-line p-4"><label htmlFor={`topic-${item.id}`} className="mb-2 block text-xs font-medium text-faint">CONTENTS · {sections.length} TOPICS</label><Select id={`topic-${item.id}`} aria-label="Study topic" value={topic} onValueChange={value => setTopic(Number(value))}>{sections.map((entry, index) => <option key={index} value={index}>{entry.heading}</option>)}</Select></div>
      {section && <article className="group p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 flex-1 text-xl font-semibold leading-8">{section.heading}</h2><Button size="sm" variant="ghost" className="shrink-0 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" disabled={ask.isPending} onClick={define}>Define concept</Button></div>
        <Suspense fallback={<NotebookText text={section.body} />}><NotebookFigures id={item.id} topic={topic} section={section} sources={item.sources}><NotebookText text={section.body} /></NotebookFigures></Suspense>
        <div className="mt-6">{cite(section)}</div>
        <div className="mt-5 flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => addToNotes(`${section.heading}\n\n${section.body}`)}><Save />Save topic to notes</Button><Button size="sm" variant="ghost" onClick={() => { setPanel('chat'); setQuestion(`Explain ${section.heading} step by step.`); chatInput.current?.focus() }}>Ask about this topic</Button></div>
        <div className="mt-6 flex justify-between border-t border-line pt-4"><Button size="sm" disabled={topic === 0} onClick={() => setTopic(value => value - 1)}>Previous</Button><span className="self-center text-xs text-faint">{topic + 1} of {sections.length}</span><Button size="sm" disabled={topic === sections.length - 1} onClick={() => setTopic(value => value + 1)}>Next topic</Button></div>
      </article>}
    </section>

    <div role="separator" aria-label="Resize study guide and notebook tools" aria-orientation="vertical" aria-valuemin={35} aria-valuemax={70} aria-valuenow={Math.round(split)} tabIndex={0} className="notebook-divider hidden touch-none self-stretch cursor-col-resize items-start justify-center outline-none focus-visible:bg-accent/20" onDoubleClick={() => resize(65)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); resize(event.key === 'Home' ? 35 : event.key === 'End' ? 70 : split + (event.key === 'ArrowLeft' ? -2 : 2)) } }} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId) && content.current) { const bounds = content.current.getBoundingClientRect(); resize((event.clientX - bounds.left) / bounds.width * 100) } }} onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}><span className="sticky top-1/2 mt-32 h-12 w-1 rounded-full bg-line" /></div>
    <aside className="flex h-[min(760px,calc(100dvh-120px))] min-h-[380px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-line bg-panel xl:sticky xl:top-24">
      <div className="grid shrink-0 grid-cols-2 border-b border-line p-2" role="tablist" aria-label="Notebook tools">{(['chat', 'notes'] as const).map(tab => <button key={tab} role="tab" aria-selected={panel === tab} aria-controls={`notebook-panel-${tab}`} id={`notebook-tab-${tab}`} onClick={() => setPanel(tab)} className={`flex items-center justify-center gap-2 rounded-control px-3 py-3 text-sm font-medium ${panel === tab ? 'bg-raised text-fg' : 'text-muted hover:bg-surface-2'}`}>{tab === 'chat' ? <MessageCircle className="size-4" /> : <StickyNote className="size-4" />}{tab === 'chat' ? 'Notebook chat' : 'My notes'}</button>)}</div>
      <div id={`notebook-panel-${panel}`} className="flex min-h-0 flex-1 flex-col" role="tabpanel" aria-labelledby={`notebook-tab-${panel}`}>
      {panel === 'chat' ? <>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4" role="log" aria-label="Notebook conversation" aria-live="polite">
          {!item.messages.length && <div className="py-8 text-center"><MessageCircle className="mx-auto mb-4 size-6 text-muted" /><h3 className="font-semibold">Learn through conversation</h3><p className="mt-2 text-sm leading-6 text-muted">Ask for definitions, examples, a summary, or a deeper explanation. Answers use this notebook’s sources.</p></div>}
          {item.messages.map(message => <div key={message.id} className="space-y-3"><p className="ml-5 rounded-[14px] bg-surface-2 p-3 text-sm leading-6">{message.question}</p><NotebookText text={message.answer} />{message.citations.map(cite)}<Button size="sm" variant="ghost" onClick={() => addToNotes(message.answer)}><Save />Save answer to notes</Button></div>)}
          {ask.isPending && <div role="status" aria-label="Preparing answer"><Skeleton className="mb-2 h-4 w-3/4" /><Skeleton className="mb-2 h-4" /><Skeleton className="h-4 w-2/3" /></div>}
          <div ref={chatEnd} />
        </div>
        <form className="shrink-0 border-t border-line p-3" onSubmit={event => { event.preventDefault(); void send() }}><Textarea ref={chatInput} aria-label="Ask your notebook" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send() } }} placeholder="Ask a question about your sources…" maxLength={1500} value={question} onChange={event => setQuestion(event.target.value)} disabled={ask.isPending} className="w-full resize-none" rows={3} /><div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-faint">{item.sources.length} {item.sources.length === 1 ? 'source' : 'sources'}</span><Button size="sm" type="submit" variant="primary" loading={ask.isPending} disabled={question.trim().length < 3}><Send />Send</Button></div>{ask.error && <div className="mt-3"><Alert tone="danger">{ask.error.message}</Alert></div>}</form>
      </> : <div className="space-y-4 overflow-y-auto p-4">
        {draft ? <>
          <label className="block text-sm font-medium">Note title<Input aria-label="Note title" className="mt-2" value={draft.title} maxLength={160} disabled={save.isPending} onChange={event => { setDraft({ ...draft, title: event.target.value }); setDirty(true) }} /></label>
          <Textarea aria-label="Your notes" placeholder="Write what you’re learning…" className="min-h-64 w-full" value={draft.body} maxLength={30000} disabled={save.isPending} onChange={event => { setDraft({ ...draft, body: event.target.value }); setDirty(true) }} />
          <p className="text-xs text-faint">{dirty ? 'Unsaved draft' : 'Saved note'} · {draft.body.length.toLocaleString()} / 30,000 characters</p>
          <div className="flex flex-wrap gap-2"><Button variant="primary" loading={save.isPending} onClick={() => save.mutate(draft)}><Save />Save note</Button><Button disabled={save.isPending} onClick={() => { if (dirty) setDiscardOpen(true); else setDraft(null) }}>Close</Button></div>
          {save.error && <Alert tone="danger">{save.error.message}</Alert>}
        </> : <Button className="w-full" onClick={() => { save.reset(); setDraft({ id: '', title: '', body: '', version: 1 }); setDirty(false) }}><Plus />New note</Button>}
        {notes.isPending && <Skeleton className="h-24" />}
        {notes.error && <Alert tone="danger" action={<Button size="sm" onClick={() => void notes.refetch()}>Retry</Button>}>Could not load your notes.</Alert>}
        {!notes.isPending && !notes.error && !notes.data?.items.length && !draft && <p className="py-7 text-center text-sm leading-6 text-muted">Keep your own explanations here. Select text in the guide or chat to add it to a note.</p>}
        <div className="max-h-80 space-y-2 overflow-y-auto">{notes.data?.items.map(note => <div key={note.id} className="flex items-center gap-2 rounded-control border border-line p-3"><button disabled={Boolean(draft)} onClick={() => { save.reset(); setDraft(note); setDirty(false) }} className="min-w-0 flex-1 text-left disabled:opacity-50"><span className="block truncate text-sm font-medium">{note.title}</span><span className="mt-1 block truncate text-xs text-muted">{note.body}</span></button><Button size="icon-sm" variant="ghost" aria-label={`Delete note ${note.title}`} disabled={Boolean(draft)} onClick={() => setDeleting(note)}><Trash2 /></Button></div>)}</div>
      </div>}
      </div>
    </aside>
    {selectedText && <div className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-control border border-line bg-panel p-2 shadow-dialog lg:bottom-6" role="toolbar" aria-label="Selected text actions"><Button size="sm" variant="primary" onMouseDown={event => event.preventDefault()} onClick={() => addToNotes(selectedText)}><Save />Add to notes</Button><Button size="sm" onMouseDown={event => event.preventDefault()} onClick={() => { setPanel('chat'); setQuestion(`Define and explain this passage using the sources: ${selectedText.slice(0, 1300)}`); window.getSelection()?.removeAllRanges() }}>Explain</Button></div>}
    <Dialog open={mapOpen} onClose={() => setMapOpen(false)} title="Concept map" width={1000}><Suspense fallback={<Skeleton className="h-96" />}><NotebookMap title={item.title} sections={sections} /></Suspense></Dialog>
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete this note?" description={`Delete “${deleting?.title ?? ''}” from this notebook.`} loading={remove.isPending} onConfirm={() => { if (deleting) remove.mutate(deleting.id) }} />
    <ConfirmDialog open={discardOpen} onClose={() => setDiscardOpen(false)} title="Discard unsaved changes?" description="Your changes to this note have not been saved." onConfirm={() => { setDraft(null); setDirty(false); setDiscardOpen(false) }} />
    {remove.error && <Alert tone="danger">{remove.error.message}</Alert>}
  </div>
}
