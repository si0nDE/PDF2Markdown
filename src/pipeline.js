import { loadPDF, extractPage } from './pdf-extractor.js'
import { ocrImage } from './ocr-engine.js'
import { generateMarkdown } from './markdown-generator.js'

/**
 * Convert a PDF file to Markdown.
 *
 * @param {File} file - The PDF file to convert.
 * @param {object} options
 * @param {string} [options.password=''] - PDF password for encrypted files.
 * @param {{start: number, end: number}|null} [options.pageRange=null] - Page range (1-based, inclusive). null = all pages.
 * @param {((progress: {page: number, total: number, status: string}) => void)|null} [options.onProgress=null] - Progress callback.
 * @returns {Promise<{markdown: string, pageCount: number}>}
 */
export async function convertPDF(file, options = {}) {
  const { password = '', pageRange = null, onProgress = null } = options

  const { doc, numPages } = await loadPDF(file, password)

  const start = pageRange?.start ?? 1
  const end = pageRange?.end ?? numPages
  const pagesToProcess = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const pages = []

  for (const pageNum of pagesToProcess) {
    onProgress?.({ page: pageNum, total: numPages, status: 'extracting' })

    const pageData = await extractPage(doc, pageNum)

    if (pageData.error) {
      // Corrupt page: insert placeholder, skip further processing
      pages.push({
        pageNum,
        items: [{ text: `[Seite ${pageNum} konnte nicht gelesen werden]`, fontSize: 12, fontName: 'unknown', x: 0, y: 0 }],
        images: [],
      })
      continue
    }

    if (pageData.rawTextLength < 50) {
      // Scanned page: OCR the first available image or insert placeholder
      onProgress?.({ page: pageNum, total: numPages, status: 'ocr' })

      try {
        const text =
          pageData.images.length > 0
            ? await ocrImage(pageData.images[0].dataUrl)
            : '[Gescannte Seite — kein Bildinhalt extrahiert]'

        pages.push({
          pageNum,
          items: [{ text, fontSize: 12, fontName: 'unknown', x: 0, y: 0 }],
          images: [],
        })
      } catch {
        pages.push({
          pageNum,
          items: [{ text: `[OCR fehlgeschlagen für Seite ${pageNum}]`, fontSize: 12, fontName: 'unknown', x: 0, y: 0 }],
          images: [],
        })
      }

      continue
    }

    // Text page: OCR each embedded image
    for (const image of pageData.images) {
      try {
        image.ocrText = await ocrImage(image.dataUrl)
      } catch {
        image.ocrText = ''
      }
    }

    onProgress?.({ page: pageNum, total: numPages, status: 'done' })
    pages.push(pageData)
  }

  onProgress?.({ page: numPages, total: numPages, status: 'generating' })

  const markdown = generateMarkdown(pages)
  return { markdown, pageCount: pages.length }
}
