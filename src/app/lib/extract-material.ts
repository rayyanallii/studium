import { STUDY_LIMITS } from '../../shared/study'

export async function extractMaterial(file: File, progress: (status: string) => void): Promise<string> {
  if (file.size > STUDY_LIMITS.fileBytes || file.size === 0) throw new Error('Choose a non-empty file of 10 MB or less.')
  if (/\.(png|jpe?g|webp)$/i.test(file.name)) return ''
  const arrayBuffer = await file.arrayBuffer()
  let text = ''
  if (/\.pdf$/i.test(file.name)) {
    progress('Reading PDF…')
    const pdfjs = await import('pdfjs-dist')
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    const loading = pdfjs.getDocument({ data: arrayBuffer })
    try {
      const document = await loading.promise
      if (document.numPages > STUDY_LIMITS.pdfPages) throw new Error('Choose a PDF with 50 pages or fewer. Split longer documents into chapters.')
      const pages: string[] = []
      for (let number = 1; number <= document.numPages; number++) {
        progress(`Reading page ${number} of ${document.numPages}…`)
        const page = await document.getPage(number)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => 'str' in item ? item.str : '').join(' ').trim()
        if (!pageText) throw new Error(`Page ${number} has no extractable text. Upload scanned pages as pictures so AI can read them.`)
        pages.push(`[Page ${number}]\n${pageText}`)
      }
      text = pages.join('\n\n')
    } finally { await loading.destroy() }
  } else if (/\.docx$/i.test(file.name)) {
    progress('Reading Word document…')
    const mammoth = await import('mammoth/mammoth.browser.js')
    text = (await mammoth.extractRawText({ arrayBuffer })).value
  } else throw new Error('Choose a PDF, DOCX, PNG, JPEG or WebP file.')
  if (text.trim().length < 40) throw new Error('There is not enough readable text. Try another source or paste your notes.')
  if (text.length > STUDY_LIMITS.textCharacters) throw new Error('This document is too long. Split it into smaller sections under 80,000 characters.')
  return text.trim()
}
