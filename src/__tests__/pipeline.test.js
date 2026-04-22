import { vi, describe, test, expect, beforeEach } from 'vitest'

vi.mock('../pdf-extractor.js', () => ({
  loadPDF: vi.fn(),
  extractPage: vi.fn(),
}))

vi.mock('../ocr-engine.js', () => ({
  ocrImage: vi.fn(),
  ocrPage: vi.fn(),
  teardown: vi.fn(),
}))

vi.mock('../markdown-generator.js', () => ({
  generateMarkdown: vi.fn(),
}))

let convertPDF
let loadPDF, extractPage
let ocrImage, ocrPage
let generateMarkdown

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()

  const pdfMod = await import('../pdf-extractor.js')
  loadPDF = pdfMod.loadPDF
  extractPage = pdfMod.extractPage

  const ocrMod = await import('../ocr-engine.js')
  ocrImage = ocrMod.ocrImage
  ocrPage = ocrMod.ocrPage

  const mdMod = await import('../markdown-generator.js')
  generateMarkdown = mdMod.generateMarkdown

  const pipelineMod = await import('../pipeline.js')
  convertPDF = pipelineMod.convertPDF
})

describe('convertPDF', () => {
  test('returns { markdown, pageCount } with correct values', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [{ text: 'Hello world from a normal page', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [],
      rawTextLength: 100,
    })
    generateMarkdown.mockReturnValue('# Output')

    const result = await convertPDF(new File([], 'test.pdf'))

    expect(result).toEqual({ markdown: '# Output', pageCount: 1 })
  })

  test('text page (rawTextLength >= 50) skips ocrImage for page body', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [{ text: 'This is a long enough text on the page for extraction', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [],
      rawTextLength: 55,
    })
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'))

    expect(ocrImage).not.toHaveBeenCalled()
  })

  test('scanned page (rawTextLength < 50) triggers ocrImage and produces single text item', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [],
      images: [{ dataUrl: 'data:image/png;base64,scanned', ocrText: null }],
      rawTextLength: 10,
    })
    ocrImage.mockResolvedValue('Scanned text result')
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'))

    expect(ocrImage).toHaveBeenCalledWith('data:image/png;base64,scanned')

    const pagesArg = generateMarkdown.mock.calls[0][0]
    expect(pagesArg).toHaveLength(1)
    expect(pagesArg[0].items).toHaveLength(1)
    expect(pagesArg[0].items[0].text).toBe('Scanned text result')
    expect(pagesArg[0].images).toEqual([])
  })

  test('scanned page with no images gets placeholder text', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [],
      images: [],
      rawTextLength: 0,
    })
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'))

    expect(ocrImage).not.toHaveBeenCalled()

    const pagesArg = generateMarkdown.mock.calls[0][0]
    expect(pagesArg[0].items[0].text).toBe('[Gescannte Seite — kein Bildinhalt extrahiert]')
  })

  test('image ocrText populated for each image on text pages', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [{ text: 'Some text that is long enough to pass the threshold check', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [
        { dataUrl: 'data:image/png;base64,img1', ocrText: null },
        { dataUrl: 'data:image/png;base64,img2', ocrText: null },
      ],
      rawTextLength: 60,
    })
    ocrImage
      .mockResolvedValueOnce('Image one text')
      .mockResolvedValueOnce('Image two text')
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'))

    expect(ocrImage).toHaveBeenCalledTimes(2)
    expect(ocrImage).toHaveBeenNthCalledWith(1, 'data:image/png;base64,img1')
    expect(ocrImage).toHaveBeenNthCalledWith(2, 'data:image/png;base64,img2')

    const pagesArg = generateMarkdown.mock.calls[0][0]
    expect(pagesArg[0].images[0].ocrText).toBe('Image one text')
    expect(pagesArg[0].images[1].ocrText).toBe('Image two text')
  })

  test('image ocrText set to empty string on ocrImage failure', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [{ text: 'This is a sufficiently long text content for the page', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [{ dataUrl: 'data:image/png;base64,img1', ocrText: null }],
      rawTextLength: 55,
    })
    ocrImage.mockRejectedValue(new Error('OCR failed'))
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'))

    const pagesArg = generateMarkdown.mock.calls[0][0]
    expect(pagesArg[0].images[0].ocrText).toBe('')
  })

  test('corrupt page (error field set) gets placeholder text, no OCR called', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [],
      images: [],
      rawTextLength: 0,
      error: 'corrupt',
    })
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'))

    expect(ocrImage).not.toHaveBeenCalled()

    const pagesArg = generateMarkdown.mock.calls[0][0]
    expect(pagesArg[0].items[0].text).toBe('[Seite 1 konnte nicht gelesen werden]')
    expect(pagesArg[0].images).toEqual([])
  })

  test('page range option: only pages in range processed', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 5 })
    extractPage.mockResolvedValue({
      pageNum: 2,
      items: [{ text: 'Page content that is long enough to pass the threshold check', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [],
      rawTextLength: 60,
    })
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'), { pageRange: { start: 2, end: 3 } })

    expect(extractPage).toHaveBeenCalledTimes(2)
    expect(extractPage).toHaveBeenCalledWith({}, 2)
    expect(extractPage).toHaveBeenCalledWith({}, 3)
    expect(extractPage).not.toHaveBeenCalledWith({}, 1)
    expect(extractPage).not.toHaveBeenCalledWith({}, 4)
  })

  test('pageCount reflects number of pages actually processed', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 10 })
    extractPage.mockResolvedValue({
      pageNum: 2,
      items: [{ text: 'Content long enough to skip OCR for this particular page test', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [],
      rawTextLength: 65,
    })
    generateMarkdown.mockReturnValue('output')

    const result = await convertPDF(new File([], 'test.pdf'), { pageRange: { start: 2, end: 4 } })

    expect(result.pageCount).toBe(3)
  })

  test('progress callbacks fired with correct structure for text page', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 2 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [{ text: 'This is a text page with enough content to not trigger OCR processing', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [],
      rawTextLength: 70,
    })
    generateMarkdown.mockReturnValue('output')

    const progressCalls = []
    const onProgress = vi.fn((p) => progressCalls.push({ ...p }))

    await convertPDF(new File([], 'test.pdf'), { pageRange: { start: 1, end: 1 }, onProgress })

    const statuses = progressCalls.map((c) => c.status)
    expect(statuses).toContain('extracting')
    expect(statuses).toContain('done')
    expect(statuses).toContain('generating')

    const extractingCall = progressCalls.find((c) => c.status === 'extracting')
    expect(extractingCall).toMatchObject({ page: 1, total: 2, status: 'extracting' })

    const generatingCall = progressCalls.find((c) => c.status === 'generating')
    expect(generatingCall).toMatchObject({ total: 2, status: 'generating' })
  })

  test('progress callback fires ocr status for scanned page', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [],
      images: [{ dataUrl: 'data:image/png;base64,page', ocrText: null }],
      rawTextLength: 5,
    })
    ocrImage.mockResolvedValue('OCR result')
    generateMarkdown.mockReturnValue('output')

    const progressCalls = []
    const onProgress = vi.fn((p) => progressCalls.push({ ...p }))

    await convertPDF(new File([], 'test.pdf'), { onProgress })

    const statuses = progressCalls.map((c) => c.status)
    expect(statuses).toContain('ocr')

    const ocrCall = progressCalls.find((c) => c.status === 'ocr')
    expect(ocrCall).toMatchObject({ page: 1, total: 1, status: 'ocr' })
  })

  test('works without onProgress callback (no error thrown)', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [{ text: 'Normal page content that is definitely long enough to pass', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [],
      rawTextLength: 60,
    })
    generateMarkdown.mockReturnValue('output')

    await expect(convertPDF(new File([], 'test.pdf'))).resolves.toBeDefined()
  })

  test('password option passed to loadPDF', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [{ text: 'Content with enough length to pass the scanned detection threshold', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [],
      rawTextLength: 65,
    })
    generateMarkdown.mockReturnValue('output')

    const file = new File([], 'protected.pdf')
    await convertPDF(file, { password: 'secret' })

    expect(loadPDF).toHaveBeenCalledWith(file, 'secret')
  })

  test('scanned page OCR failure inserts error placeholder', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
    extractPage.mockResolvedValue({
      pageNum: 1,
      items: [],
      images: [{ dataUrl: 'data:image/png;base64,bad', ocrText: null }],
      rawTextLength: 0,
    })
    ocrImage.mockRejectedValue(new Error('OCR crash'))
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'))

    const pagesArg = generateMarkdown.mock.calls[0][0]
    expect(pagesArg[0].items[0].text).toBe('[OCR fehlgeschlagen für Seite 1]')
  })

  test('multiple pages processed in order', async () => {
    loadPDF.mockResolvedValue({ doc: {}, numPages: 3 })
    extractPage.mockImplementation(async (doc, pageNum) => ({
      pageNum,
      items: [{ text: `Page ${pageNum} has text content long enough to skip OCR`, fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
      images: [],
      rawTextLength: 55,
    }))
    generateMarkdown.mockReturnValue('output')

    await convertPDF(new File([], 'test.pdf'))

    expect(extractPage).toHaveBeenCalledTimes(3)
    const pagesArg = generateMarkdown.mock.calls[0][0]
    expect(pagesArg).toHaveLength(3)
    expect(pagesArg.map((p) => p.pageNum)).toEqual([1, 2, 3])
  })
})
