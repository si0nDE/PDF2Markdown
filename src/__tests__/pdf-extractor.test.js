import { vi, describe, test, expect, beforeEach } from 'vitest'

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}))

import * as pdfjs from 'pdfjs-dist'
import { loadPDF, extractPage } from '../pdf-extractor.js'

function makeMockPage(textItems = []) {
  return {
    getTextContent: vi.fn().mockResolvedValue({ items: textItems }),
    getOperatorList: vi.fn().mockResolvedValue({ fnArray: [], argsArray: [] }),
    getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 }),
    render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
  }
}

function makeMockDoc(pages = []) {
  return {
    numPages: pages.length,
    getPage: vi.fn((n) => Promise.resolve(pages[n - 1])),
  }
}

describe('loadPDF', () => {
  test('returns doc and numPages', async () => {
    const mockDoc = makeMockDoc([makeMockPage(), makeMockPage()])
    pdfjs.getDocument.mockReturnValue({ promise: Promise.resolve(mockDoc) })

    const file = new File(['%PDF'], 'test.pdf', { type: 'application/pdf' })
    const result = await loadPDF(file)

    expect(result.numPages).toBe(2)
    expect(result.doc).toBe(mockDoc)
  })

  test('throws PASSWORD_REQUIRED for protected PDF', async () => {
    pdfjs.getDocument.mockReturnValue({
      promise: Promise.reject(new Error('No password given')),
    })

    const file = new File(['%PDF'], 'secret.pdf', { type: 'application/pdf' })
    await expect(loadPDF(file)).rejects.toMatchObject({ code: 'PASSWORD_REQUIRED' })
  })

  test('passes password to getDocument', async () => {
    const mockDoc = makeMockDoc([makeMockPage()])
    pdfjs.getDocument.mockReturnValue({ promise: Promise.resolve(mockDoc) })

    const file = new File(['%PDF'], 'test.pdf', { type: 'application/pdf' })
    await loadPDF(file, 'secret123')

    expect(pdfjs.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'secret123' })
    )
  })
})

describe('extractPage', () => {
  beforeEach(() => vi.clearAllMocks())

  test('extracts text items with fontSize and fontName', async () => {
    const textItems = [
      { str: 'Hello', transform: [14, 0, 0, 14, 10, 20], fontName: 'TimesNewRoman' },
    ]
    const doc = makeMockDoc([makeMockPage(textItems)])

    const result = await extractPage(doc, 1)

    expect(result.pageNum).toBe(1)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ text: 'Hello', fontSize: 14, fontName: 'TimesNewRoman', x: 10, y: 20 })
  })

  test('computes rawTextLength', async () => {
    const textItems = [
      { str: 'Hello', transform: [12, 0, 0, 12, 0, 0], fontName: 'Arial' },
      { str: ' World', transform: [12, 0, 0, 12, 0, 0], fontName: 'Arial' },
    ]
    const doc = makeMockDoc([makeMockPage(textItems)])

    const result = await extractPage(doc, 1)
    expect(result.rawTextLength).toBe(11)
  })

  test('images array is empty when no image operators present', async () => {
    const doc = makeMockDoc([makeMockPage()])
    const result = await extractPage(doc, 1)
    expect(result.images).toEqual([])
  })

  test('images array contains entry with dataUrl and ocrText: null when image operator present', async () => {
    const mockCtx = {}
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc123'),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas)

    const page = {
      getTextContent: vi.fn().mockResolvedValue({ items: [] }),
      getOperatorList: vi.fn().mockResolvedValue({ fnArray: [85], argsArray: [] }),
      getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 }),
      render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
    }
    const doc = makeMockDoc([page])

    const result = await extractPage(doc, 1)

    expect(result.images).toHaveLength(1)
    expect(result.images[0]).toEqual({ dataUrl: expect.any(String), ocrText: null })

    vi.restoreAllMocks()
  })

  test('returns corrupt error for failed pages', async () => {
    const doc = {
      numPages: 1,
      getPage: vi.fn().mockRejectedValue(new Error('stream error')),
    }

    const result = await extractPage(doc, 1)
    expect(result.error).toBe('corrupt')
    expect(result.items).toEqual([])
    expect(result.images).toEqual([])
    expect(result.rawTextLength).toBe(0)
  })
})
