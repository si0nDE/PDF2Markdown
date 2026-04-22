import { vi, describe, test, expect, beforeEach } from 'vitest'

// Store created worker instances for inspection in tests
let createdWorkers = []

// Mock tesseract.js before importing the module
vi.mock('tesseract.js', () => {
  return {
    createWorker: vi.fn().mockImplementation(async (lang) => {
      const worker = {
        recognize: vi.fn().mockResolvedValue({
          data: { text: 'Mocked OCR text' },
        }),
        terminate: vi.fn().mockResolvedValue(undefined),
      }
      createdWorkers.push(worker)
      return worker
    }),
  }
})

let ocrImage, ocrPage, teardown

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  createdWorkers = []
  const mod = await import('../ocr-engine.js')
  ocrImage = mod.ocrImage
  ocrPage = mod.ocrPage
  teardown = mod.teardown
})

describe('ocr-engine', () => {
  test('lazy init: createWorker not called before first ocrImage', async () => {
    const { createWorker: cwMock } = await import('tesseract.js')
    expect(cwMock).not.toHaveBeenCalled()

    // Now call ocrImage and it should call createWorker
    await ocrImage('data:image/png;base64,test')
    expect(cwMock).toHaveBeenCalledOnce()
  })

  test('worker reuse: createWorker called once for multiple ocrImage calls', async () => {
    const { createWorker: cwMock } = await import('tesseract.js')

    // First call
    await ocrImage('data:image/png;base64,test1')
    expect(cwMock).toHaveBeenCalledTimes(1)

    // Second call reuses same worker
    await ocrImage('data:image/png;base64,test2')
    expect(cwMock).toHaveBeenCalledTimes(1) // Still called once total
  })

  test('ocrImage returns trimmed string from worker', async () => {
    const result = await ocrImage('data:image/png;base64,test')
    expect(typeof result).toBe('string')
    expect(result).toBe('Mocked OCR text')
  })

  test('OCR_UNAVAILABLE thrown on initialization failure', async () => {
    const { createWorker: cwMock } = await import('tesseract.js')
    cwMock.mockRejectedValueOnce(new Error('Worker initialization failed'))

    await expect(ocrImage('data:image/png;base64,test')).rejects.toMatchObject({
      code: 'OCR_UNAVAILABLE',
      message: 'Worker initialization failed',
    })
  })

  test('teardown terminates worker', async () => {
    // Initialize worker by calling ocrImage
    await ocrImage('data:image/png;base64,test')

    const worker = createdWorkers[0]
    expect(worker.terminate).not.toHaveBeenCalled()

    await teardown()
    expect(worker.terminate).toHaveBeenCalled()
  })

  test('after teardown, next ocrImage call re-initializes worker', async () => {
    const { createWorker: cwMock } = await import('tesseract.js')

    // First call initializes
    await ocrImage('data:image/png;base64,test1')
    expect(cwMock).toHaveBeenCalledTimes(1)

    // Teardown
    await teardown()

    // Reset mock call count to verify new initialization
    cwMock.mockClear()

    // Next call re-initializes
    await ocrImage('data:image/png;base64,test2')
    expect(cwMock).toHaveBeenCalledTimes(1)
  })

  test('ocrImage passes correct language to createWorker', async () => {
    const { createWorker: cwMock } = await import('tesseract.js')

    await ocrImage('data:image/png;base64,test')

    expect(cwMock).toHaveBeenCalledWith('deu+eng')
  })

  test('ocrImage calls worker.recognize with correct image source', async () => {
    const dataUrl = 'data:image/png;base64,abc123'

    await ocrImage(dataUrl)

    const worker = createdWorkers[0]
    expect(worker.recognize).toHaveBeenCalledWith(dataUrl)
  })

  test('worker reset on recognize failure allows re-initialization on next call', async () => {
    const { createWorker: cwMock } = await import('tesseract.js')

    // First call initializes worker successfully
    await ocrImage('data:image/png;base64,test1')
    expect(cwMock).toHaveBeenCalledTimes(1)

    // Make recognize throw on the next call
    const brokenWorker = createdWorkers[0]
    brokenWorker.recognize.mockRejectedValueOnce(new Error('recognize failed'))

    // Second call should throw
    await expect(ocrImage('data:image/png;base64,test2')).rejects.toThrow('recognize failed')

    // Third call must re-initialize (createWorker called again)
    await ocrImage('data:image/png;base64,test3')
    expect(cwMock).toHaveBeenCalledTimes(2)
  })

  test('ocrPage delegates to ocrImage via canvas.toDataURL', async () => {
    const fakeDataUrl = 'data:image/png;base64,canvasdata'
    const canvas = {
      toDataURL: vi.fn().mockReturnValue(fakeDataUrl),
    }

    const result = await ocrPage(canvas)

    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png')
    expect(result).toBe('Mocked OCR text')
  })
})
