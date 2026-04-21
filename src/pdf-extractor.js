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
  try {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()

    const items = content.items.map(item => ({
      text: item.str,
      fontSize: Math.abs(item.transform[0]),
      fontName: item.fontName ?? 'unknown',
      x: item.transform[4],
      y: item.transform[5],
    }))

    const rawTextLength = items.reduce((sum, i) => sum + i.text.length, 0)
    const images = await extractImages(page)

    return { pageNum, items, images, rawTextLength }
  } catch {
    return { pageNum, items: [], images: [], rawTextLength: 0, error: 'corrupt' }
  }
}

async function extractImages(page) {
  const opList = await page.getOperatorList()
  // PDF.js OPS.paintImageXObject = 85
  const hasImage = opList.fnArray.includes(85)
  if (!hasImage) return []

  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise

  return [{ dataUrl: canvas.toDataURL('image/png'), ocrText: null }]
}
