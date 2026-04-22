import { createWorker } from 'tesseract.js'

let worker = null

/**
 * Recognizes text from an image using Tesseract.js OCR.
 * Lazily initializes the worker on first call and reuses it for subsequent calls.
 *
 * @param {string} dataUrl - Data URL of the image to recognize (e.g., 'data:image/png;base64,...')
 * @returns {Promise<{text: string}>} - Object containing the recognized text
 * @throws {Object} - Object with code: 'OCR_UNAVAILABLE' if worker initialization fails
 */
export async function recognizeImage(dataUrl) {
  // Lazy initialization: create worker only on first call
  if (worker === null) {
    try {
      worker = await createWorker('eng')
    } catch (err) {
      throw {
        code: 'OCR_UNAVAILABLE',
        message: err.message,
      }
    }
  }

  // Recognize text using the worker
  const { data } = await worker.recognize(dataUrl)

  return { text: data.text }
}

/**
 * Terminates the OCR worker and resets state.
 * After calling this, the next recognizeImage call will create a new worker.
 *
 * @returns {Promise<void>}
 */
export async function teardown() {
  if (worker !== null) {
    await worker.terminate()
    worker = null
  }
}
