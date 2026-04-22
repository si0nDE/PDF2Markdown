import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'

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

import { createWorker } from 'tesseract.js'
import { recognizeImage, teardown } from '../ocr-engine.js'

describe('ocr-engine', () => {
  afterEach(async () => {
    // Reset module state between tests
    await teardown()
    createdWorkers = []
    vi.clearAllMocks()
  })

  test('lazy init: createWorker not called before first recognizeImage', async () => {
    // Import fresh module to check initial state
    const { createWorker: cwMock } = await import('tesseract.js')
    expect(cwMock).not.toHaveBeenCalled()

    // Now call recognizeImage and it should call createWorker
    await recognizeImage('data:image/png;base64,test')
    expect(cwMock).toHaveBeenCalledOnce()
  })

  test('worker reuse: createWorker called once for multiple recognizeImage calls', async () => {
    const cwMock = createWorker

    // First call
    await recognizeImage('data:image/png;base64,test1')
    expect(cwMock).toHaveBeenCalledTimes(1)

    // Second call reuses same worker
    await recognizeImage('data:image/png;base64,test2')
    expect(cwMock).toHaveBeenCalledTimes(1) // Still called once total
  })

  test('recognizeImage returns { text: ... } from worker', async () => {
    const result = await recognizeImage('data:image/png;base64,test')
    expect(result).toEqual({ text: 'Mocked OCR text' })
  })

  test('OCR_UNAVAILABLE thrown on initialization failure', async () => {
    createWorker.mockRejectedValueOnce(new Error('Worker initialization failed'))

    await expect(recognizeImage('data:image/png;base64,test')).rejects.toMatchObject({
      code: 'OCR_UNAVAILABLE',
      message: 'Worker initialization failed',
    })
  })

  test('teardown terminates worker', async () => {
    // Initialize worker by calling recognizeImage
    await recognizeImage('data:image/png;base64,test')

    const worker = createdWorkers[0]
    expect(worker.terminate).not.toHaveBeenCalled()

    await teardown()
    expect(worker.terminate).toHaveBeenCalled()
  })

  test('after teardown, next recognizeImage call re-initializes worker', async () => {
    const cwMock = createWorker

    // First call initializes
    await recognizeImage('data:image/png;base64,test1')
    expect(cwMock).toHaveBeenCalledTimes(1)

    // Teardown
    await teardown()

    // Reset mock call count to verify new initialization
    cwMock.mockClear()

    // Next call re-initializes
    await recognizeImage('data:image/png;base64,test2')
    expect(cwMock).toHaveBeenCalledTimes(1)
  })

  test('recognizeImage passes correct language to createWorker', async () => {
    const cwMock = createWorker

    await recognizeImage('data:image/png;base64,test')

    expect(cwMock).toHaveBeenCalledWith('eng')
  })

  test('recognizeImage calls worker.recognize with correct image source', async () => {
    const dataUrl = 'data:image/png;base64,abc123'

    await recognizeImage(dataUrl)

    const worker = createdWorkers[0]
    expect(worker.recognize).toHaveBeenCalledWith(dataUrl)
  })
})
