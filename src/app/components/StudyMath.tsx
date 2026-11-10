import { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import 'katex/dist/katex.min.css'

/** Only KaTeX's untrusted-mode output is inserted; source HTML is never accepted. */
function Formula({ value, display }: { value: string; display: boolean }) {
  const html = useMemo(() => katex.renderToString(value, { displayMode: display, throwOnError: false, trust: false, strict: 'ignore', maxExpand: 200, maxSize: 12, output: 'htmlAndMathml' }), [value, display])
  return <span className={display ? 'block max-w-full overflow-x-auto py-2' : 'inline-block max-w-full overflow-x-auto align-middle'} dangerouslySetInnerHTML={{ __html: html }} />
}

export function StudyMath({ text }: { text: string }) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+\$)/g)
  return <>{parts.map((part, i) => {
    if (/^(\$\$|\\\[)/.test(part)) return <Formula key={i} value={part.slice(2, -2)} display />
    if (part.startsWith('\\(')) return <Formula key={i} value={part.slice(2, -2)} display={false} />
    if (part.startsWith('$') && part.endsWith('$')) return <Formula key={i} value={part.slice(1, -1)} display={false} />
    // Explicit source markup is safe text plus semantic elements, never HTML.
    return <span key={i}>{part.split(/(<(?:sub|sup)>[^<>]+<\/(?:sub|sup)>|\*\*[^*]+\*\*)/g).map((piece, j) => piece.startsWith('<sub>') ? <sub key={j}>{piece.slice(5, -6)}</sub> : piece.startsWith('<sup>') ? <sup key={j}>{piece.slice(5, -6)}</sup> : piece.startsWith('**') ? <strong key={j} className="font-semibold text-fg">{piece.slice(2, -2)}</strong> : piece)}</span>
  })}</>
}
