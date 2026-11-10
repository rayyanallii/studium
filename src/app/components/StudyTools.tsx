import { ArrowUpRight, Layers, NotebookPen, ScanLine } from 'lucide-react'
import { Link } from 'react-router'
import type { StudyKind } from '../../shared/study'

const STUDY_IMAGES: Record<StudyKind, string> = {
  flashcards: '/images/study-icons/ai-flashcards-3d.png',
  quiz: '/images/study-icons/ai-quiz-3d.png',
  notebook: '/images/study-icons/ai-notebook-3d.png',
}

export function StudyToolIcon({ kind, className = 'size-10' }: { kind: StudyKind; className?: string }) {
  return <img src={STUDY_IMAGES[kind]} alt="" aria-hidden="true" width={1254} height={1254} decoding="async" draggable={false} className={`shrink-0 object-contain ${className}`} />
}

export const STUDY_TOOLS = [
  { kind: 'flashcards' as StudyKind, title: 'AI Flashcards', detail: 'Turn your notes into something that sticks.', action: 'Practice active recall', icon: Layers, color: 'lilac', route: '/flashcards' },
  { kind: 'quiz' as StudyKind, title: 'AI Quiz', detail: 'Find out what you know. Work on what you don’t.', action: 'Test your understanding', icon: ScanLine, color: 'mint', route: '/quizzes' },
  { kind: 'notebook' as StudyKind, title: 'AI Notebook', detail: 'Ask questions. Find answers in your sources.', action: 'Connect your ideas', icon: NotebookPen, color: 'peach', route: '/notebooks' },
]
export function StudyTools() {
  return <div className="grid gap-4 sm:grid-cols-3">{STUDY_TOOLS.map(tool => <Link key={tool.kind} to={tool.route} className="study-feature flex min-h-[190px] flex-col rounded-[16px] p-5">
    <div className="mb-4 flex items-start justify-between"><StudyToolIcon kind={tool.kind} className="size-24" /><ArrowUpRight className="mt-1 size-4 opacity-60" /></div>
    <h2 className="text-[20px] font-semibold tracking-tight">{tool.title}</h2><p className="mt-2 max-w-[25ch] text-[15px] leading-relaxed text-muted">{tool.detail}</p>
    <span className="mt-5 text-[14px] text-muted font-medium">{tool.action}</span>
  </Link>)}</div>
}
