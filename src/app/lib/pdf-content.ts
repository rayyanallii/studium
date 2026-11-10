import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import type { SourceFigure } from '../../shared/study'

export async function openPdf(data: ArrayBuffer) {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs.getDocument({ data })
}

/** Preserve line breaks and explicit raised/lowered small glyphs from PDF geometry. */
export function pdfText(items: TextItem[]) {
  let result = '', baseline: TextItem | undefined
  for (const item of items) {
    if (!item.str) continue
    const size = Math.hypot(item.transform[2], item.transform[3]) || item.height
    const baseSize = baseline ? Math.hypot(baseline.transform[2], baseline.transform[3]) || baseline.height : size
    const dy = baseline ? item.transform[5] - baseline.transform[5] : 0
    const dx = baseline ? item.transform[4] - (baseline.transform[4] + baseline.width) : 0
    const script = baseline && size < baseSize * .9 && Math.abs(dy) > baseSize * .12 && Math.abs(dy) < baseSize * .85 && Math.abs(dx) < baseSize
    if (script) result += `<${dy > 0 ? 'sup' : 'sub'}>${item.str}</${dy > 0 ? 'sup' : 'sub'}>`
    else { result += (result && !result.endsWith('\n') ? (Math.abs(dy) > baseSize * .6 ? '\n' : ' ') : '') + item.str; baseline = item }
    if (item.hasEOL && !script) { result += '\n'; baseline = undefined }
  }
  return result.trim()
}

export async function renderPdfPage(page: PDFPageProxy) {
  const viewport = page.getViewport({ scale: 1 })
  const scaled = page.getViewport({ scale: Math.min(2, 1400 / Math.max(viewport.width, viewport.height)) })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(scaled.width); canvas.height = Math.ceil(scaled.height)
  await page.render({ canvas, viewport: scaled }).promise
  return canvas
}

export function cropPage(canvas: HTMLCanvasElement, rect: SourceFigure['rect']) {
  const [x, y, w, h] = rect, crop = document.createElement('canvas')
  crop.width = Math.max(1, Math.round(w * canvas.width)); crop.height = Math.max(1, Math.round(h * canvas.height))
  crop.getContext('2d')!.drawImage(canvas, x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height, 0, 0, crop.width, crop.height)
  const url = crop.toDataURL('image/png'); crop.width = crop.height = 0
  return url
}

export async function findPdfFigures(pdf: PDFDocumentProxy, sourceId: string): Promise<SourceFigure[]> {
  const { OPS, Util } = await import('pdfjs-dist')
  const figures: SourceFigure[] = []
  for (let number = 1; number <= Math.min(pdf.numPages, 50); number++) {
    const page = await pdf.getPage(number), viewport = page.getViewport({ scale: 1 })
    const [ops, text] = await Promise.all([page.getOperatorList(), page.getTextContent()])
    let matrix = [1, 0, 0, 1, 0, 0]
    const stack: number[][] = []
    for (let i = 0; i < ops.fnArray.length; i++) {
      const op = ops.fnArray[i], args = ops.argsArray[i]
      if (op === OPS.save || op === OPS.paintFormXObjectBegin) { stack.push([...matrix]); if (op === OPS.paintFormXObjectBegin && args[0]) matrix = Util.transform(matrix, args[0]) }
      else if (op === OPS.restore || op === OPS.paintFormXObjectEnd) matrix = stack.pop() ?? [1, 0, 0, 1, 0, 0]
      else if (op === OPS.transform) matrix = Util.transform(matrix, args)
      else if (op === OPS.paintImageXObject || op === OPS.paintInlineImageXObject) {
        const transform = Util.transform(viewport.transform, matrix)
        const points = [[0, 0], [1, 0], [0, 1], [1, 1]].map(point => { Util.applyTransform(point, transform); return point })
        const left = Math.max(0, Math.min(...points.map(p => p[0]))), top = Math.max(0, Math.min(...points.map(p => p[1])))
        const right = Math.min(viewport.width, Math.max(...points.map(p => p[0]))), bottom = Math.min(viewport.height, Math.max(...points.map(p => p[1])))
        if (right - left < 50 || bottom - top < 40 || (right - left) * (bottom - top) > viewport.width * viewport.height * .85) continue
        const nearby = text.items.filter((item): item is TextItem => 'str' in item).map(item => { const point = [item.transform[4], item.transform[5]]; Util.applyTransform(point, viewport.transform); return { item, point } }).filter(({ point }) => point[0] >= left - 40 && point[0] <= right + 40 && point[1] >= bottom - 10 && point[1] <= bottom + 85).map(({ item }) => item.str).join(' ').trim()
        figures.push({ sourceId, page: number, rect: [left / viewport.width, top / viewport.height, (right - left) / viewport.width, (bottom - top) / viewport.height], caption: nearby.slice(0, 400) || `Source diagram · page ${number}` })
        if (figures.length >= 60) return figures
      }
    }
    page.cleanup()
  }
  return figures
}

export function relatedFigures(figures: SourceFigure[], heading: string) {
  const words = heading.toLowerCase().match(/[a-z]{4,}/g)?.filter(word => !['with', 'from', 'this', 'that', 'study', 'concept', 'understanding', 'introduction'].includes(word)) ?? []
  return figures.map(figure => ({ figure, score: words.filter(word => figure.caption.toLowerCase().includes(word)).length })).filter(entry => entry.score >= Math.min(2, Math.max(1, words.length))).sort((a, b) => b.score - a.score).slice(0, 2).map(entry => entry.figure)
}
