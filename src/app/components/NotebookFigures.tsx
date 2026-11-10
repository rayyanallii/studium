import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist'
import type { NotebookSection, SourceFigure, StudyMaterial } from '../../shared/study'
import { cropPage, findPdfFigures, openPdf, relatedFigures, renderPdfPage } from '../lib/pdf-content'
import { fetchMaterialFile } from '../lib/study-api'
import { api } from '../lib/api'
import { Alert, Button, Dialog, Input, Select, Skeleton } from './ui'

const dragType = 'application/x-studium-figure'
const key = (figure: SourceFigure) => `${figure.sourceId}:${figure.page}:${figure.rect.join(',')}`

function FigureImage({ figure, pdf }: { figure: SourceFigure; pdf?: PDFDocumentProxy }) {
  const [url, setUrl] = useState(''), [error, setError] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => { const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect() } }, { rootMargin: '200px' }); if (host.current) observer.observe(host.current); return () => observer.disconnect() }, [])
  useEffect(() => {
    let active = true
    setUrl(''); setError(false)
    if (pdf && visible) void pdf.getPage(figure.page).then(renderPdfPage).then(canvas => { if (active) setUrl(cropPage(canvas, figure.rect)); canvas.width = canvas.height = 0 }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [pdf, visible, figure.page, figure.rect.join(',')])
  return <div ref={host}>{error ? <p className="p-4 text-sm text-muted">Could not render this source image.</p> : url ? <img src={url} alt={figure.caption} className="max-h-80 w-full rounded-lg bg-white object-contain" draggable={false} /> : <Skeleton className="h-32 w-full" />}</div>
}

export function NotebookFigures({ id, topic, section, sources, children }: { id: string; topic: number; section: NotebookSection; sources: StudyMaterial[]; children: ReactNode }) {
  const [documents, setDocuments] = useState<Record<string, PDFDocumentProxy>>({})
  const [figures, setFigures] = useState<SourceFigure[]>([])
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0)
  const [cropSource, setCropSource] = useState(''), [pageNumber, setPageNumber] = useState(1), [pageImage, setPageImage] = useState(''), [pageError, setPageError] = useState('')
  const [rect, setRect] = useState<SourceFigure['rect'] | null>(null), [caption, setCaption] = useState(''), [dragging, setDragging] = useState(false)
  const start = useRef<[number, number] | null>(null)
  const client = useQueryClient()
  const pdfs = sources.filter(source => source.mime === 'application/pdf')
  const sourceKey = pdfs.map(source => source.id).join(',')
  useEffect(() => {
    let active = true
    const controller = new AbortController(), opened: PDFDocumentLoadingTask[] = []
    setDocuments({}); setFigures([]); setError(''); setLoading(Boolean(sourceKey))
    void (async () => {
      for (const source of pdfs) {
        try {
          const blob = await fetchMaterialFile(source, controller.signal)
          const task = await openPdf(await blob.arrayBuffer())
          opened.push(task)
          const pdf = await task.promise
          if (!active) { await task.destroy(); break }
          setDocuments(current => ({ ...current, [source.id]: pdf }))
          const found = await findPdfFigures(pdf, source.id)
          if (active) setFigures(current => [...current, ...found])
        } catch { if (active) setError(`Could not read diagrams from ${source.title}. Your study text is still available.`) }
      }
      if (active) setLoading(false)
    })()
    return () => { active = false; controller.abort(); opened.forEach(pdf => { void pdf.destroy() }) }
  }, [sourceKey, retry])
  useEffect(() => {
    let active = true
    setPageImage(''); setPageError(''); setRect(null)
    const pdf = documents[cropSource]
    if (pdf) void pdf.getPage(pageNumber).then(renderPdfPage).then(canvas => { if (active) setPageImage(canvas.toDataURL('image/png')); canvas.width = canvas.height = 0 }).catch(() => { if (active) setPageError('Could not display this page. Try another page or reopen the source.') })
    return () => { active = false }
  }, [cropSource, pageNumber, documents])
  const visible = section.figures ?? relatedFigures(figures.filter(figure => figure.sourceId === section.sourceId), section.heading)
  const save = useMutation({ mutationFn: (input: { topic: number; figures: SourceFigure[]; previous: SourceFigure[] }) => api(`/study/artifacts/${id}/figures`, { method: 'PATCH', json: input }), onSuccess: () => client.invalidateQueries({ queryKey: ['studyArtifact', id] }) })
  const persist = (next: SourceFigure[]) => save.mutate({ topic, figures: next, previous: section.figures ?? [] })
  const add = (figure: SourceFigure) => { if (!save.isPending && visible.length < 8 && !visible.some(current => key(current) === key(figure))) persist([...visible, figure]) }
  if (!pdfs.length) return <>{children}</>
  return <>
    <details className="mb-5 rounded-control border border-line p-3">
      <summary className="cursor-pointer text-sm font-medium">PDF diagrams {loading ? '· Reading sources…' : `· ${figures.length} found`}</summary>
      <p className="mt-3 text-xs leading-5 text-muted">Drag a diagram into this topic, or choose Add. Crop a page to include vector drawings and labels. Caption matches appear below automatically.</p>
      <div className="my-3 flex flex-wrap gap-2">{pdfs.map(source => <Button key={source.id} size="sm" disabled={!documents[source.id]} onClick={() => { setCropSource(source.id); setPageNumber(1); setCaption(section.heading) }}>Crop from {source.title}</Button>)}</div>
      {loading && <Skeleton className="h-16" />}
      {error && <Alert tone="danger" action={<Button size="sm" onClick={() => setRetry(value => value + 1)}>Retry</Button>}>{error}</Alert>}
      <div className="grid max-h-96 grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">{figures.map(figure => <figure key={key(figure)} draggable onDragStart={event => { event.dataTransfer.setData(dragType, key(figure)); event.dataTransfer.effectAllowed = 'copy' }} className="cursor-grab rounded-lg border border-line p-2"><FigureImage figure={figure} pdf={documents[figure.sourceId]} /><figcaption className="my-2 line-clamp-3 text-xs leading-5 text-muted">Page {figure.page} · {figure.caption}</figcaption><Button size="sm" disabled={save.isPending || visible.length >= 8 || visible.some(current => key(current) === key(figure))} onClick={() => add(figure)}>Add to topic</Button></figure>)}</div>
      {!loading && !figures.length && !error && <p className="text-xs text-muted">No separate embedded pictures found. Use Crop from PDF for vector diagrams or scanned pages.</p>}
    </details>
    <div className={`min-w-0 rounded-lg ${dragging ? 'outline-2 outline-offset-4 outline-blue-500' : ''}`} onDragOver={event => { if (event.dataTransfer.types.includes(dragType)) { event.preventDefault(); setDragging(true); event.dataTransfer.dropEffect = 'copy' } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }} onDrop={event => { event.preventDefault(); setDragging(false); const figure = figures.find(entry => key(entry) === event.dataTransfer.getData(dragType)); if (figure) add(figure) }}>
      {children}
      {dragging && <p className="my-3 text-sm text-blue-400">Drop to add this diagram to the topic</p>}
      {visible.map(figure => <figure key={key(figure)} className="mt-5 rounded-control border border-line p-3"><FigureImage figure={figure} pdf={documents[figure.sourceId]} /><figcaption className="mt-3 text-xs leading-5 text-muted">{figure.caption}<span className="mt-1 block">{sources.find(source => source.id === figure.sourceId)?.title} · Page {figure.page}{section.figures === undefined ? ' · Matched by caption' : ''}</span></figcaption><div className="mt-2 flex gap-2"><Button size="sm" variant="ghost" onClick={() => { setCropSource(figure.sourceId); setPageNumber(figure.page); setCaption(figure.caption) }}>View source page</Button><Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => persist(visible.filter(entry => key(entry) !== key(figure)))}>Remove</Button></div></figure>)}
      {visible.length >= 8 && <p className="mt-3 text-xs text-muted">This topic has 8 diagrams. Remove one before adding another.</p>}
      {save.error && <Alert tone="danger">{save.error.message}</Alert>}
    </div>
    <Dialog open={Boolean(cropSource)} onClose={() => setCropSource('')} title="Crop a diagram from the PDF" width={880}>
      <div className="mb-4 flex flex-wrap items-center gap-3"><label className="text-sm">Page</label><Select aria-label="PDF page" value={pageNumber} onValueChange={value => setPageNumber(Number(value))}>{Array.from({ length: documents[cropSource]?.numPages ?? 1 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</Select><p className="text-xs text-muted">Drag a rectangle around the diagram and its labels.</p></div>
      {pageError ? <Alert tone="danger">{pageError}</Alert> : !pageImage ? <Skeleton className="h-96" /> : <div className="relative touch-none select-none overflow-hidden rounded-lg bg-white" onPointerDown={event => { const bounds = event.currentTarget.getBoundingClientRect(); start.current = [(event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height]; setRect(null); event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={event => { if (!start.current) return; const bounds = event.currentTarget.getBoundingClientRect(); const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)); setRect([Math.min(start.current[0], x), Math.min(start.current[1], y), Math.abs(x - start.current[0]), Math.abs(y - start.current[1])]) }} onPointerUp={() => { start.current = null }} onPointerCancel={() => { start.current = null }}>
        <img src={pageImage} alt={`PDF page ${pageNumber}. Drag to select a diagram.`} className="block w-full" draggable={false} />{rect && <div className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/15" style={{ left: `${rect[0] * 100}%`, top: `${rect[1] * 100}%`, width: `${rect[2] * 100}%`, height: `${rect[3] * 100}%` }} />}
      </div>}
      <label className="mt-4 block text-sm font-medium">Caption<Input className="mt-2" value={caption} onChange={event => setCaption(event.target.value)} maxLength={400} /></label>
      <div className="mt-4 flex justify-end gap-2"><Button onClick={() => setCropSource('')}>Cancel</Button><Button variant="primary" disabled={!rect || rect[2] < .02 || rect[3] < .02 || visible.length >= 8 || save.isPending} onClick={() => { if (rect) { add({ sourceId: cropSource, page: pageNumber, rect, caption: caption || `Source diagram · page ${pageNumber}` }); setCropSource('') } }}>Add crop to topic</Button></div>
    </Dialog>
  </>
}
