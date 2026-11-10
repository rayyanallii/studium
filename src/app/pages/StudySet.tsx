import { lazy, Suspense, useState } from 'react'
const NotebookMap = lazy(() => import('../components/NotebookMap').then(module => ({ default: module.NotebookMap })))
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Download, FileText, RotateCcw, Send } from 'lucide-react'
import { Choice } from '../components/fields'
import { cx } from '../lib/cx'
import { Alert, Badge, Button, Card, Dialog, Input, PageHeader, Progress, Skeleton, useToast } from '../components/ui'
import { STUDY_TOOLS } from '../components/StudyTools'
import { downloadMaterial, useAskNotebook, useAttemptQuiz, useReviewCard, useStudyDetail } from '../lib/study-api'
import type { Citation, QuizAttempt, StudyDetail, StudyMaterial } from '../../shared/study'

export function StudySet() {
  const { id = '' } = useParams(), detail = useStudyDetail(id)
  const [source, setSource] = useState<StudyMaterial | null>(null)
  const toast = useToast()
  if (detail.error) return <Alert tone="danger" title="Could not open this study set" action={<Button onClick={() => void detail.refetch()}>Try again</Button>}>{detail.error.message}</Alert>
  if (!detail.data) return <div className="space-y-5"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-96" /></div>
  const item = detail.data, tool = STUDY_TOOLS.find(tool => tool.kind === item.kind)!
  const cite = (citation: Citation) => <SourceCitation key={`${citation.sourceId}-${citation.quote}`} citation={citation} sources={item.sources} onOpen={setSource} />
  return <div className="space-y-6">
    <Link to={tool.route} className="inline-flex items-center gap-2 text-[14px] text-muted hover:text-fg"><ArrowLeft className="size-3.5" />{tool.title}</Link>
    <PageHeader title={item.title} subtitle={`${tool.title} · Built from ${item.sources.length} ${item.sources.length === 1 ? 'source' : 'sources'}`} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        {item.kind === 'flashcards' && <FlashcardStudy key={id} item={item} cite={cite} />}
        {item.kind === 'quiz' && <QuizStudy key={id} item={item} cite={cite} />}
        {item.kind === 'notebook' && <NotebookStudy key={id} item={item} cite={cite} />}
      </div>
      <aside className="space-y-4 xl:sticky xl:top-24"><Card className="flex flex-col gap-3 border border-line p-5 shadow-none"><h2 className="text-[14px] font-semibold">Your sources</h2><p className="text-[14px] leading-relaxed text-muted">Everything in this set starts here. Open a source to check the original text.</p><div className="divide-y divide-line">{item.sources.map(source => <button key={source.id} onClick={() => setSource(source)} className="flex w-full items-start gap-3 py-4 text-left"><FileText className="mt-0.5 size-4 shrink-0 text-accent" /><span className="min-w-0"><span className="block text-[15px] font-medium">{source.title}</span><span className="mt-1 block text-[11px] text-muted">{source.fileName || 'Pasted notes'}</span></span></button>)}</div></Card><p className="px-1 text-[11px] leading-relaxed text-faint">AI can make mistakes. Citations match the uploaded text; check that the explanation follows from them.</p></aside>
    </div>
    <Dialog open={Boolean(source)} onClose={() => setSource(null)} title={source?.title ?? 'Source'} width={760} footer={source?.fileName && <Button onClick={() => { void downloadMaterial(source).catch(error => toast(error.message, 'danger')) }}><Download />Download original</Button>}><pre className="whitespace-pre-wrap font-sans text-[15px] leading-7">{source?.text}</pre></Dialog>
  </div>
}

type StudyProps = { item: StudyDetail; cite: (citation: Citation) => React.ReactNode }

function FlashcardStudy({ item, cite }: StudyProps) {
  const cards = item.content.cards!, [index, setIndex] = useState(0), [revealed, setRevealed] = useState(false)
  const review = useReviewCard(item.id), card = cards[index]
  const move = (offset: number) => { setIndex(current => (current + offset + cards.length) % cards.length); setRevealed(false) }
  const rate = async (learned: boolean) => { try { await review.mutateAsync({ cardIndex: index, learned }); move(1) } catch { /* visible below */ } }
  return <div className="space-y-5">
    <div className="flex items-center justify-between text-[15px]"><span className="text-muted">Card {index + 1} of {cards.length}</span><Badge tone="success">{item.learned.length} learned</Badge></div><Progress value={100 * item.learned.length / cards.length} />
    <button onClick={() => setRevealed(value => !value)} aria-label={revealed ? 'Show question' : 'Reveal answer'} className="flex min-h-[330px] w-full flex-col items-center justify-center rounded-[20px] border border-line p-7 text-center sm:p-12" style={{ background: 'var(--study-lilac)', color: 'var(--study-lilac-ink)' }}>
      <span className="mb-7 text-[14px] font-medium opacity-75">{revealed ? 'Answer' : 'Think it through'}</span><span className={`${revealed ? 'text-[20px]' : 'text-[25px]'} max-w-[34ch] whitespace-pre-wrap font-medium leading-relaxed tracking-tight`}>{revealed ? card.back : card.front}</span><span className="mt-8 text-[11px] opacity-70">{revealed ? 'Click to return to the question' : 'Click or press Enter to reveal'}</span>
    </button>
    {revealed && cite(card)}
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3"><Button size="icon" aria-label="Previous card" onClick={() => move(-1)}><ChevronLeft /></Button><div className="col-span-3 row-start-2 flex justify-center gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"><Button disabled={!revealed || review.isPending} onClick={() => void rate(false)}><RotateCcw />Study again</Button><Button variant="primary" disabled={!revealed} loading={review.isPending} onClick={() => void rate(true)}><Check />Got it</Button></div><Button className="col-start-3 row-start-1" size="icon" aria-label="Next card" onClick={() => move(1)}><ChevronRight /></Button></div>
    {review.error && <Alert tone="danger">{review.error.message}</Alert>}
    {item.learned.length === cards.length && <Alert tone="success" title="You’ve reviewed every card">All cards are marked learned. Come back later to check what you remember.</Alert>}
  </div>
}

function QuizStudy({ item, cite }: StudyProps) {
  const questions = item.content.questions!, [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1)), [result, setResult] = useState<QuizAttempt | null>(null)
  const attempt = useAttemptQuiz(item.id), answered = answers.filter(answer => answer !== -1).length
  const submit = async () => { try { setResult(await attempt.mutateAsync(answers)); window.scrollTo({ top: 0, behavior: 'smooth' }) } catch { /* visible below */ } }
  return <div className="space-y-5">
    {result ? <Card className="flex flex-col gap-3 border-0 p-6 shadow-none" style={{ background: 'var(--study-mint)', color: 'var(--study-mint-ink)' }}><span className="text-[15px]">Your result</span><p className="text-[36px] font-semibold tracking-tight">{result.score} <span className="text-[20px] font-normal opacity-60">/ {result.total}</span></p><p className="text-[15px]">Review the explanations below, then give it another go.</p><Button className="mt-2 self-start" onClick={() => { setResult(null); setAnswers(questions.map(() => -1)) }}><RotateCcw />Try again</Button></Card> : <div className="flex items-center justify-between text-[15px]"><span className="text-muted">Choose one answer for each question.</span><Badge>{answered} / {questions.length}</Badge></div>}
    {questions.map((question, index) => <Card key={index} className="flex flex-col gap-4 border border-line p-5 shadow-none sm:p-6"><div className="flex items-start gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[14px] text-muted">{index + 1}</span><h2 className="text-[15px] font-medium leading-relaxed">{question.question}</h2></div><fieldset disabled={Boolean(result) || attempt.isPending} className="space-y-2"><legend className="sr-only">Question {index + 1}: {question.question}</legend>{question.options.map((option, optionIndex) => <Choice key={optionIndex} checked={answers[index] === optionIndex} disabled={Boolean(result) || attempt.isPending} tone={result && question.correctIndex === optionIndex ? 'correct' : result && answers[index] === optionIndex ? 'wrong' : 'default'} onChange={() => setAnswers(current => current.map((answer, position) => position === index ? optionIndex : answer))}>{option}</Choice>)}</fieldset>{result && <div className="space-y-3 border-t border-line pt-4"><Badge tone={answers[index] === question.correctIndex ? 'success' : 'warning'}>{answers[index] === question.correctIndex ? 'Correct' : 'Review this concept'}</Badge><p className="text-[15px] leading-7 text-muted">{question.explanation}</p>{cite(question)}</div>}</Card>)}
    {!result && <div className="flex justify-end"><Button variant="primary" disabled={answered !== questions.length} loading={attempt.isPending} onClick={submit}>Check my answers<ArrowRight /></Button></div>}
    {attempt.error && <Alert tone="danger">{attempt.error.message}</Alert>}
    {item.attempts.length > 0 && <p className="text-[14px] text-muted">Last saved attempt: {item.attempts[0].score}/{item.attempts[0].total}. {item.attempts.length} recent {item.attempts.length === 1 ? 'attempt' : 'attempts'} saved.</p>}
  </div>
}

function NotebookStudy({ item, cite }: StudyProps) {
  const [mapOpen, setMapOpen] = useState(false)
  const [question, setQuestion] = useState(''), ask = useAskNotebook(item.id)
  const submit = async () => { if (!question.trim()) return; try { await ask.mutateAsync(question.trim()); setQuestion('') } catch { /* visible below */ } }
  return <div className="space-y-6">
    <div className="flex flex-wrap gap-2"><Button onClick={() => setMapOpen(value => !value)}>{mapOpen ? 'Hide mind map' : 'Generate mind map'}</Button>{['Summarize the key topics', 'Turn the main ideas into bullet points', 'Explain the hardest concept step by step', 'Add definitions, examples and subtopics from all sources'].map(prompt => <Button key={prompt} size="sm" disabled={ask.isPending} onClick={() => setQuestion(prompt)}>{prompt}</Button>)}</div>
    {mapOpen && <Suspense fallback={<Skeleton className="h-[480px]" />}><NotebookMap title={item.title} sections={item.content.sections ?? []} /></Suspense>}
    <nav aria-label="Notebook topics" className="flex flex-wrap gap-2">{item.content.sections?.map((section, index) => <a key={index} href={`#concept-${index}`} className="rounded-control border border-line px-3 py-2 text-sm hover:bg-surface-2">{section.heading}</a>)}</nav>
    <Card className="flex flex-col gap-6 border border-line p-6 shadow-none sm:p-8"><div className="flex items-center gap-2 text-[14px] text-muted"><BookOpen className="size-4" />Source guide</div>{item.content.sections?.map((section, index) => <section key={index} id={`concept-${index}`} className="scroll-mt-24 space-y-3"><h2 className="text-[18px] font-semibold tracking-tight">{section.heading}</h2><p className="whitespace-pre-wrap text-[14px] leading-7 text-muted">{section.body}</p>{cite(section)}</section>)}</Card>
    <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Explore your sources</h2><Badge>{item.messages.length} questions</Badge></div>
    {item.messages.length === 0 && <div className="rounded-card p-5 text-[15px] leading-relaxed" style={{ background: 'var(--study-peach)', color: 'var(--study-peach-ink)' }}>Ask for an explanation, compare two ideas, or find a detail in your material. Answers stay grounded in the sources attached to this notebook.</div>}
    <div className="space-y-5" aria-live="polite">{item.messages.map(message => <div key={message.id} className="space-y-3"><div className="ml-8 rounded-card bg-surface-2 px-5 py-4 text-[14px]">{message.question}</div><Card className="flex flex-col gap-3 border border-line p-5 shadow-none"><p className="whitespace-pre-wrap text-[14px] leading-7">{message.answer}</p>{message.citations.map(cite)}</Card></div>)}</div>
    <form onSubmit={event => { event.preventDefault(); void submit() }} className="rounded-card border border-line-strong bg-panel p-3 shadow-pop"><div className="flex items-center gap-2"><Input aria-label="Ask your notebook" placeholder="What would you like to understand?" value={question} onChange={event => setQuestion(event.target.value)} maxLength={1500} disabled={ask.isPending} className="min-w-0 flex-1 border-0 bg-transparent shadow-none" /><Button type="submit" variant="primary" size="icon" aria-label="Send question" loading={ask.isPending} disabled={question.trim().length < 3}><Send /></Button></div>{ask.isPending && <Skeleton className="my-3 h-24" />}{ask.isPending && <p role="status" className="px-3 pt-2 text-[14px] text-muted">Finding an answer in your sources…</p>}{ask.error && <div className="pt-3"><Alert tone="danger">{ask.error.message}</Alert></div>}</form>
  </div>
}

function SourceCitation({ citation, sources, onOpen }: { citation: Citation; sources: StudyMaterial[]; onOpen: (source: StudyMaterial) => void }) {
  const source = sources.find(source => source.id === citation.sourceId)
  const [open, setOpen] = useState(false)
  return <div className="rounded-control border border-line px-3 py-2 text-[14px]">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-2 text-left text-muted transition-colors hover:text-fg"><span>Source: {source?.title ?? 'Unavailable source'}</span><ChevronDown className={cx('size-4 shrink-0 transition-transform duration-150', open && 'rotate-180')} /></button>
    {open && <div className="mt-2"><blockquote className="my-3 border-l-2 border-accent/40 pl-3 leading-6 text-muted">“{citation.quote}”</blockquote>{source && <Button variant="ghost" size="sm" onClick={() => onOpen(source)}>Read source<FileText /></Button>}</div>}
  </div>
}
