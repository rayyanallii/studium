import { useRef, useState } from 'react'
import { StudySetsTable, SourceMaterialsTable } from '../components/StudyLibraryTables'
import { useNavigate } from 'react-router'
import { ArrowRight, Check, Layers, Plus, Upload } from 'lucide-react'
import { Alert, Badge, Button, Card, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Segmented, Select, Skeleton, Textarea, useToast } from '../components/ui'
import { STUDY_TOOLS, StudyToolIcon, StudyTools } from '../components/StudyTools'
import { useDeleteArtifact, useDeleteMaterial, useGenerateStudy, useMaterials, useStudyArtifacts, useUploadMaterial } from '../lib/study-api'
import { useSubjects } from '../lib/api'
import { extractMaterial } from '../lib/extract-material'
import { STUDY_LIMITS, type StudyKind, type StudyMaterial } from '../../shared/study'

export function StudyLibrary({ kind }: { kind?: StudyKind }) {
  const materials = useMaterials(), artifacts = useStudyArtifacts(), subjectsQuery = useSubjects()
  const generate = useGenerateStudy(), removeMaterial = useDeleteMaterial(), removeArtifact = useDeleteArtifact()
  const [selected, setSelected] = useState<string[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<StudyMaterial | null>(null)
  const [deleting, setDeleting] = useState<{ id: string; title: string; type: 'source' | 'set' } | null>(null)
  const [generationKind, setGenerationKind] = useState<StudyKind>(kind || 'flashcards')
  const [cardCount, setCardCount] = useState(8)
  const [topicMode, setTopicMode] = useState<'all' | 'topic'>('all')
  const [cardTopic, setCardTopic] = useState('')
  const isFlashcards = (kind ?? generationKind) === 'flashcards'
  const navigate = useNavigate(), toast = useToast()
  const tool = STUDY_TOOLS.find(tool => tool.kind === kind)
  const sources = materials.data?.items ?? []
  const subjectName = (subjectId: string | null) => (subjectId ? subjectsQuery.data?.items.find(subject => subject.id === subjectId)?.name : null)
  const sets = (artifacts.data?.items ?? []).filter(item => (!kind || item.kind === kind))
  const selection = selected.filter(id => sources.some(source => source.id === id))
  const topicSuggestions = [...new Set((artifacts.data?.items ?? []).filter(item => item.kind === 'notebook' && item.sourceIds.some(id => selection.includes(id))).flatMap(item => item.content.sections?.map(section => section.heading) ?? []))].slice(0, 12)

  const create = async () => {
    if (isFlashcards && topicMode === 'topic' && !cardTopic.trim()) return
    try { const result = await generate.mutateAsync({ kind: kind ?? generationKind, sourceIds: selection, ...(isFlashcards ? { flashcards: { count: cardCount, ...(topicMode === 'topic' ? { topic: cardTopic.trim() } : {}) } } : {}) }); navigate(`/study/${result.id}`) } catch { /* mutation error is shown below */ }
  }
  const confirmDelete = async () => {
    if (!deleting) return
    try { await (deleting.type === 'source' ? removeMaterial : removeArtifact).mutateAsync(deleting.id); setSelected(ids => ids.filter(id => id !== deleting.id)); setDeleting(null); toast('Deleted') } catch (error) { toast(error instanceof Error ? error.message : 'Could not delete.', 'danger'); setDeleting(null) }
  }

  return <div className="flex flex-col gap-7">
    <PageHeader title={tool?.title ?? 'Your study library'} subtitle={tool ? tool.detail : 'Bring your materials. Build your understanding.'} actions={<Button variant="primary" onClick={() => setUploadOpen(true)}><Plus />Add material</Button>} />
    {!kind && <StudyTools />}
    {(materials.error || artifacts.error) && <Alert tone="danger" action={<Button onClick={() => { void materials.refetch(); void artifacts.refetch() }}>Try again</Button>}>{materials.error?.message || artifacts.error?.message}</Alert>}

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="min-w-0 space-y-5">
        <h2 className="text-base font-semibold">{kind === 'flashcards' ? 'Your decks' : kind === 'quiz' ? 'Your quizzes' : kind === 'notebook' ? 'Your notebooks' : 'Study sets'} <span className="ml-1 text-sm font-normal text-muted">{sets.length}</span></h2>
        {artifacts.isLoading ? <Skeleton className="h-52" /> : sets.length === 0 ? <Card className="border border-dashed border-line-strong bg-transparent shadow-none"><EmptyState icon={tool ? <StudyToolIcon kind={tool.kind} /> : <Layers />} title="Your next study session starts here" description="Add your notes or upload a document, then select sources to create your first study set." action={<Button onClick={() => setUploadOpen(true)}><Upload />Add study material</Button>} /></Card> : <StudySetsTable items={sets} subjectName={subjectName} onDelete={item => setDeleting({ id: item.id, title: item.title, type: 'set' })} />}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3"><h2 className="text-base font-semibold">Source materials <span className="ml-1 text-sm font-normal text-muted">{sources.length}</span></h2><span className="text-sm text-muted">{selection.length} of 4 selected</span></div>
        {materials.isLoading ? <Skeleton className="h-32" /> : sources.length === 0 ? <Button onClick={() => setUploadOpen(true)}><Upload />Add your first source</Button> : <SourceMaterialsTable items={sources} selection={selection} subjectName={subjectName} onOpen={setPreview} onDelete={source => setDeleting({ id: source.id, title: source.title, type: 'source' })} onSelect={(id, checked) => { if (checked && selection.length >= 4) return toast('Select up to 4 sources.'); setSelected(ids => checked ? [...ids, id] : ids.filter(value => value !== id)) }} />}

      </div>

      <Card className="flex flex-col gap-4 border border-line p-5 shadow-none xl:sticky xl:top-24">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Create a study set</h2><Badge tone="accent">AI</Badge></div>
        <p className="text-[15px] leading-relaxed text-muted">Select the source materials you want to study. Your set will include quotes you can check against the originals.</p>
        {!kind && <div className="flex flex-col gap-2">{STUDY_TOOLS.map(option => <button key={option.kind} aria-pressed={generationKind === option.kind} onClick={() => setGenerationKind(option.kind)} className={`flex items-center gap-3 rounded-control border p-3 text-left text-[15px] ${generationKind === option.kind ? 'border-accent bg-accent-soft text-accent' : 'border-line hover:bg-surface-2'}`}><StudyToolIcon kind={option.kind} className="size-9" /><span className="flex-1">{option.title}</span>{generationKind === option.kind && <Check className="size-4" />}</button>)}</div>}
        <div className="rounded-control bg-surface-2 p-3 text-[14px] text-muted">{selection.length ? `${selection.length} ${selection.length === 1 ? 'source selected' : 'sources selected'}` : 'No sources selected yet'}</div>
        {isFlashcards && <fieldset disabled={generate.isPending} className="min-w-0 space-y-4">
          <Field label="How many flashcards?"><Select aria-label="Number of flashcards" value={cardCount} onValueChange={value => setCardCount(Number(value))}>{Array.from({ length: 18 }, (_, i) => <option key={i + 3} value={i + 3}>{`${i + 3} cards`}</option>)}</Select></Field>
          <Field label="What would you like to study?"><Select aria-label="Flashcard coverage" value={topicMode} onValueChange={value => setTopicMode(value as 'all' | 'topic')}><option value="all">All topics in my sources</option><option value="topic">A specific topic</option></Select></Field>
          {topicMode === 'topic' && <div className="space-y-2"><Field label="Topic"><Input aria-label="Flashcard topic" placeholder="e.g. Oxidation and reduction" maxLength={160} value={cardTopic} onChange={event => setCardTopic(event.target.value)} /></Field><p className="text-xs leading-5 text-muted">Choose a topic covered by your selected materials.</p>{topicSuggestions.length > 0 && <><p className="pt-1 text-xs font-medium text-muted">From your notebooks</p><div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">{topicSuggestions.map(topic => <button key={topic} type="button" onClick={() => setCardTopic(topic)} className="rounded-control border border-line px-2 py-1 text-left text-xs hover:bg-surface-2">{topic}</button>)}</div></>}</div>}
          <p className="text-xs leading-5 text-muted">{cardCount} cards · {topicMode === 'topic' ? cardTopic.trim() || 'Choose a topic above' : 'All topics'}</p>
        </fieldset>}
        <Button variant="primary" disabled={!selection.length || materials.isError || (isFlashcards && topicMode === 'topic' && !cardTopic.trim())} loading={generate.isPending} onClick={create}>{generate.isPending ? 'Creating your study set…' : isFlashcards ? `Create ${cardCount} flashcards` : `Create ${(kind ?? generationKind) === 'quiz' ? 'quiz' : 'notebook'}`}<ArrowRight /></Button>
        {generate.isPending && <p role="status" className="text-[14px] text-muted">Reading your sources and checking citations. This can take about a minute.</p>}
        {generate.error && <Alert tone="danger">{generate.error.message}</Alert>}
        <p className="text-[11px] leading-relaxed text-faint">Selected source text is sent to the study AI to create your set. Check AI explanations against the cited material.</p>
      </Card>
    </div>
    <UploadMaterialDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={id => setSelected(ids => [...ids.slice(0, 3), id])} />
    <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.title ?? 'Source'} description="Extracted source text used by your study tools" width={720}><pre className="whitespace-pre-wrap font-sans text-[15px] leading-7">{preview?.text}</pre></Dialog>
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title={`Delete ${deleting?.title ?? 'item'}?`} description={deleting?.type === 'source' ? 'The original file and extracted text will be removed. Sources referenced by study sets must be kept until those sets are deleted.' : 'This study set and its review progress or conversation will be removed. Your source materials will stay in the library.'} onConfirm={confirmDelete} loading={removeMaterial.isPending || removeArtifact.isPending} />
  </div>
}

function UploadMaterialDialog({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: (id: string) => void }) {
  const [mode, setMode] = useState<'file' | 'notes'>('file'), [title, setTitle] = useState(''), [text, setText] = useState(''), [file, setFile] = useState<File | null>(null), [subjectId, setSubjectId] = useState('')
  const subjects = useSubjects().data?.items ?? []
  const [status, setStatus] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false)
  const upload = useUploadMaterial(), input = useRef<HTMLInputElement>(null)
  const choose = (chosen?: File) => { if (!chosen) return; setFile(chosen); setTitle(chosen.name.replace(/\.[^.]+$/, '')); setError('') }
  const submit = async () => {
    setBusy(true); setError('')
    try {
      if (mode === 'file' && !file) throw new Error('Choose a source file.')
      const body = new FormData(); body.set('title', title.trim())
      if (subjectId) body.set('subjectId', subjectId)
      if (mode === 'file' && file) { body.set('file', file); body.set('text', await extractMaterial(file, setStatus)); setStatus(/\.(png|jpe?g|webp)$/i.test(file.name) ? 'Reading the image with AI…' : 'Saving your source…') }
      else { body.set('text', text); setStatus('Saving your notes…') }
      const result = await upload.mutateAsync(body)
      onUploaded(result.id); onClose(); setTitle(''); setText(''); setFile(null); setSubjectId('')
    } catch (error) { setError(error instanceof Error ? error.message : 'Upload failed. Try again.') }
    finally { setBusy(false); setStatus('') }
  }
  return <Dialog open={open} onClose={() => { if (!busy) onClose() }} title="Add study material" description="One source can become flashcards, a quiz, or a notebook." width={560} footer={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="primary" onClick={submit} loading={busy} disabled={!title.trim() || (mode === 'file' ? !file : text.trim().length < 40)}>Add material</Button></>}>
    <div className="space-y-5"><Segmented value={mode} onChange={next => { if (!busy) setMode(next) }} options={[{ value: 'file', label: 'Upload a file' }, { value: 'notes', label: 'Paste notes' }]} />
      {mode === 'file' && <div onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) choose(event.dataTransfer.files[0]) }} className={`rounded-card border border-dashed p-7 text-center ${dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface-2/40'}`}>
        <input ref={input} type="file" className="sr-only" tabIndex={-1} accept=".pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={event => choose(event.target.files?.[0])} aria-label="Choose source file" disabled={busy} />
        <Upload className="mx-auto mb-3 size-6 text-accent" /><p className="break-all text-[15px] font-medium">{file ? file.name : 'Drop a file here, or browse'}</p><p className="mt-2 text-[14px] text-muted">PDF, DOCX, PNG, JPEG or WebP · Up to 10 MB</p><Button className="mt-4" onClick={() => input.current?.click()} disabled={busy}>{file ? 'Choose another file' : 'Browse files'}</Button>
      </div>}
      <Field label="Title"><Input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} disabled={busy} placeholder="e.g. Biology — Cell structure" /></Field>
      <Field label="Subject" hint="Optional. Keeps this material next to the subject it belongs to."><Select value={subjectId} onValueChange={setSubjectId} disabled={busy}><option value="">No subject</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</Select></Field>
      {mode === 'notes' && <Field label="Your notes" hint="At least 40 characters. Paste the material you want to learn."><Textarea value={text} onChange={event => setText(event.target.value)} maxLength={STUDY_LIMITS.textCharacters} className="min-h-[180px]" disabled={busy} /></Field>}
      <p className="text-[13px] leading-relaxed text-muted">Documents are read as text; PDFs support up to 50 text-based pages. Upload scanned pages as images. Image text is read by AI and should be reviewed after upload.</p>
      {busy && <p role="status" className="text-[15px] text-accent">{status}</p>}{error && <Alert tone="danger">{error}</Alert>}
    </div>
  </Dialog>
}
