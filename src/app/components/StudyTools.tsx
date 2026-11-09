import { ArrowUpRight, Layers, NotebookPen, ScanLine } from 'lucide-react'
import { Link } from 'react-router'
import type { StudyKind } from '../../shared/study'

export const STUDY_TOOLS = [
  { kind: 'flashcards' as StudyKind, title: 'AI Flashcards', detail: 'Turn your notes into something that sticks.', action: 'Practice active recall', icon: Layers, color: 'lilac', route: '/flashcards' },
  { kind: 'quiz' as StudyKind, title: 'AI Quiz', detail: 'Find out what you know. Work on what you don’t.', action: 'Test your understanding', icon: ScanLine, color: 'mint', route: '/quizzes' },
  { kind: 'notebook' as StudyKind, title: 'AI Notebook', detail: 'Ask questions. Find answers in your sources.', action: 'Connect your ideas', icon: NotebookPen, color: 'peach', route: '/notebooks' },
]
export function StudyTools() {
  return <div className="grid gap-4 sm:grid-cols-3">{STUDY_TOOLS.map(tool => <Link key={tool.kind} to={tool.route} className="study-feature flex min-h-[190px] flex-col rounded-[16px] p-5">
    <div className="mb-5 flex items-center justify-between"><span className="grid size-12 place-items-center rounded-[14px]" style={{ background: `var(--study-${tool.color})`, color: `var(--study-${tool.color}-ink)` }}><tool.icon className="size-6" strokeWidth={1.6} /></span><ArrowUpRight className="size-4 opacity-60" /></div>
    <h2 className="text-[20px] font-semibold tracking-tight">{tool.title}</h2><p className="mt-2 max-w-[25ch] text-[15px] leading-relaxed text-muted">{tool.detail}</p>
    <span className="mt-5 text-[14px] text-muted font-medium">{tool.action}</span>
  </Link>)}</div>
}
