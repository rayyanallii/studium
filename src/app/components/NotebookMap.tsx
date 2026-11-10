import { useEffect, useRef } from 'react'
import { Markmap } from 'markmap-view'
import type { NotebookSection } from '../../shared/study'

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)

export function NotebookMap({ title, sections }: { title: string; sections: NotebookSection[] }) {
  const svg = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!svg.current) return
    const map = Markmap.create(svg.current, { autoFit: true, duration: 0, maxWidth: 220, initialExpandLevel: 2 }, {
      content: escape(title), children: sections.map(section => ({
        content: escape(section.heading),
        children: section.body.split('\n').map(line => line.trim()).filter(Boolean).slice(0, 16).map(line => ({ content: escape(line), children: [] })),
      })),
    })
    const observer = new ResizeObserver(() => { void map.fit() })
    observer.observe(svg.current)
    return () => { observer.disconnect(); map.destroy() }
  }, [title, sections])
  return <div className="rounded-card border border-line bg-panel p-4"><p className="mb-3 text-sm text-muted">Scroll to zoom, drag to pan, and select a branch to expand or collapse it.</p><svg ref={svg} aria-label={`Mind map of ${title}`} className="h-[480px] w-full [&_.markmap-foreign]:text-fg" /><details className="mt-3 text-sm"><summary className="cursor-pointer">Text outline</summary><ul className="mt-3 list-disc space-y-2 pl-5">{sections.map((section, index) => <li key={index}>{section.heading}</li>)}</ul></details></div>
}
