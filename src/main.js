import './style.css'
import './ui/upload.js'
import { showOutput } from './ui/output.js'
import { showProgress, updateProgress, showDone, hideProgress } from './ui/progress.js'
import { getCurrentFile, getPageRange } from './ui/upload.js'
import { convertPDF } from './pipeline.js'
import { analyzeSize } from './size-analyzer.js'

document.getElementById('convert-btn').addEventListener('click', async () => {
  const file = getCurrentFile()
  if (!file) return

  showProgress()
  updateProgress('loading')

  try {
    const sizeInfo = analyzeSize(file.size)
    const options = {
      pageRange: getPageRange(),
      onProgress: ({ status, page, total }) => updateProgress(status, page, total),
    }
    const { markdown } = await convertPDF(file, options)
    showDone()
    setTimeout(() => {
      hideProgress()
      showOutput(markdown, sizeInfo)
    }, 800)
  } catch (err) {
    hideProgress()
    if (err.code === 'OCR_UNAVAILABLE') {
      alert('Tesseract konnte nicht geladen werden. Bitte Internetverbindung prüfen.')
    } else {
      alert(`Fehler bei der Konvertierung: ${err.message ?? err.code ?? 'Unbekannter Fehler'}`)
    }
  }
})
