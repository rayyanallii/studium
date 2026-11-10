import { STUDY_LIMITS } from '../../shared/study'
import { openPdf, pdfText, renderPdfPage } from './pdf-content'
import { api } from './api'

export async function extractMaterial(file: File, progress: (status: string) => void): Promise<string> {
  if (file.size > STUDY_LIMITS.fileBytes || file.size === 0) throw new Error('Choose a non-empty file of 10 MB or less.')
  if (/\.(png|jpe?g|webp)$/i.test(file.name)) return ''
  const arrayBuffer = await file.arrayBuffer()
  let text = ''
  if (/\.pdf$/i.test(file.name)) {
    progress('Reading PDF…')
    const loading = await openPdf(arrayBuffer)
    try {
      const document = await loading.promise
      if (document.numPages > STUDY_LIMITS.pdfPages) throw new Error('Choose a PDF with 50 pages or fewer. Split longer documents into chapters.')
      const pages: string[] = []
      for (let number = 1; number <= document.numPages; number++) {
        progress(`Reading page ${number} of ${document.numPages}…`)
        const page = await document.getPage(number)
        const content = await page.getTextContent()
        let pageText = pdfText(content.items.filter(item => 'str' in item))
        if (pageText.length < 20) {
          progress(`Reading scanned page ${number} with AI…`)
          const canvas = await renderPdfPage(page)
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not read this page.')), 'image/png'))
          canvas.width = canvas.height = 0
          const form = new FormData(); form.set('file', blob, 'page.png')
          const result = await api<{ text: string }>('/study/ocr-page', { method: 'POST', body: form })
          pageText = result.text || '[No readable text on this page]'
        }
        pages.push(`[Page ${number}]\n${pageText}`)
        page.cleanup()
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
