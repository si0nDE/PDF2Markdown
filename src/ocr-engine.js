import { createWorker } from 'tesseract.js'

let worker = null

/**
 * Recognizes text from an image using Tesseract.js OCR.
 * Lazily initializes the worker on first call and reuses it for subsequent calls.
 *
 * @param {string} dataUrl - Data URL of the image to recognize (e.g., 'data:image/png;base64,...')
 * @returns {Promise<string>} - Trimmed recognized text string
 * @throws {Error} - Error with code: 'OCR_UNAVAILABLE' if worker initialization fails
 */
export async function ocrImage(dataUrl) {
  // Lazy initialization: create worker only on first call
  if (worker === null) {
    try {
      worker = await createWorker('deu+eng', 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract',
        langPath: '/tesseract',
      })
    } catch (err) {
      const e = Object.assign(new Error(err.message), { code: 'OCR_UNAVAILABLE' })
      throw e
    }
  }

  // Recognize text using the worker
  try {
    const { data: { text } } = await worker.recognize(dataUrl)
    return text.trim()
  } catch (err) {
    worker = null
    throw err
  }
}

/**
 * Recognizes text from a canvas element using Tesseract.js OCR.
 *
 * @param {HTMLCanvasElement} canvas - Canvas element to recognize text from
 * @returns {Promise<string>} - Trimmed recognized text string
 */
export async function ocrPage(canvas) {
  return ocrImage(canvas.toDataURL('image/png'))
}

/**
 * Terminates the OCR worker and resets state.
 * After calling this, the next ocrImage call will create a new worker.
 *
 * @returns {Promise<void>}
 */
export async function teardown() {
  if (worker !== null) {
    await worker.terminate()
    worker = null
  }
}
