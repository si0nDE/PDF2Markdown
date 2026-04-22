import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function readFileAsArrayBuffer(file) {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer()
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export async function loadPDF(file, password = '') {
  const arrayBuffer = await readFileAsArrayBuffer(file)
  const params = { data: arrayBuffer }
  if (password) params.password = password

  const task = pdfjs.getDocument(params)
  try {
    const doc = await task.promise
    return { doc, numPages: doc.numPages }
  } catch (err) {
    const msg = err.message?.toLowerCase() ?? ''
    if (msg.includes('password')) throw { code: 'PASSWORD_REQUIRED' }
    throw err
  }
}

export async function extractPage(doc, pageNum) {
  let page, items, rawTextLength
  try {
    page = await doc.getPage(pageNum)
    const content = await page.getTextContent()

    items = content.items.map(item => ({
      text: item.str,
      fontSize: Math.abs(item.transform[0]),
      fontName: item.fontName ?? 'unknown',
      x: item.transform[4],
      y: item.transform[5],
    }))

    rawTextLength = items.reduce((sum, i) => sum + i.text.length, 0)
  } catch {
    return { pageNum, items: [], images: [], rawTextLength: 0, error: 'corrupt' }
  }

  let images = []
  try {
    images = await extractImages(page)
  } catch (err) {
    console.warn(`extractImages failed on page ${pageNum}:`, err)
  }

  return { pageNum, items, images, rawTextLength }
}

const OPS_PAINT_IMAGE_X_OBJECT = 85

async function extractImages(page) {
  if (typeof document === 'undefined') return []

  const opList = await page.getOperatorList()
  const hasImage = opList.fnArray.includes(OPS_PAINT_IMAGE_X_OBJECT)
  if (!hasImage) return []

  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise

  return [{ dataUrl: canvas.toDataURL('image/png'), ocrText: null }]
}
