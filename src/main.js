import './style.css'
import './ui/upload.js'
import { showOutput } from './ui/output.js'
import { showProgress, updateProgress, showDone, hideProgress } from './ui/progress.js'
import { getCurrentFile, getPageRange } from './ui/upload.js'
import { convertPDF } from './pipeline.js'

document.getElementById('convert-btn').addEventListener('click', async () => {
  const file = getCurrentFile()
  if (!file) return

  showProgress()

  try {
    const options = { pageRange: getPageRange() }
    const { markdown, sizeInfo } = await convertPDF(file, options, updateProgress)
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
