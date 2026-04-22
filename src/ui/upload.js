import { loadPDF } from '../pdf-extractor.js'
import { analyzeSize } from '../size-analyzer.js'

const dropZone = document.getElementById('drop-zone')
const fileInput = document.getElementById('file-input')
const fileInfo = document.getElementById('file-info')
const fileNameEl = document.getElementById('file-name')
const pageCountEl = document.getElementById('page-count')
const sizeIndicator = document.getElementById('size-indicator')
const pageRange = document.getElementById('page-range')
const rangeStart = document.getElementById('range-start')
const rangeEnd = document.getElementById('range-end')
const passwordSection = document.getElementById('password-section')
const pdfPassword = document.getElementById('pdf-password')
const passwordError = document.getElementById('password-error')
const unlockBtn = document.getElementById('unlock-btn')
const convertBtn = document.getElementById('convert-btn')

let currentFile = null

export function getCurrentFile() { return currentFile }

export function getPageRange() {
  if (pageRange.hidden) return null
  return {
    start: parseInt(rangeStart.value) || 1,
    end: parseInt(rangeEnd.value) || 1,
  }
}

async function handleFile(file) {
  if (!file || !file.name.toLowerCase().endsWith('.pdf')) return
  currentFile = file

  const sizeInfo = analyzeSize(file.size)
  fileNameEl.textContent = file.name
  sizeIndicator.textContent = `${sizeInfo.mb} MB`
  sizeIndicator.className = `indicator ${sizeInfo.status}`
  if (sizeInfo.warning) sizeIndicator.title = sizeInfo.warning

  fileInfo.hidden = false
  passwordSection.hidden = true
  passwordError.hidden = true
  pageRange.hidden = true
  convertBtn.hidden = true
  pageCountEl.textContent = 'Lädt…'

  try {
    const { numPages } = await loadPDF(file)
    pageCountEl.textContent = `${numPages} Seiten`

    if (numPages > 100) {
      rangeStart.value = 1
      rangeEnd.value = Math.min(numPages, 50)
      rangeEnd.max = numPages
      pageRange.hidden = false
    }

    convertBtn.hidden = false
  } catch (err) {
    if (err.code === 'PASSWORD_REQUIRED') {
      pageCountEl.textContent = 'Passwortgeschützt'
      passwordSection.hidden = false
    }
  }
}

unlockBtn.addEventListener('click', async () => {
  if (!currentFile) return
  passwordError.hidden = true
  pdfPassword.style.borderColor = ''
  try {
    const { numPages } = await loadPDF(currentFile, pdfPassword.value)
    pageCountEl.textContent = `${numPages} Seiten`
    passwordSection.hidden = true
    convertBtn.hidden = false
  } catch {
    pdfPassword.style.borderColor = 'red'
    passwordError.hidden = false
  }
})

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover') })
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'))
dropZone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropZone.classList.remove('dragover')
  handleFile(e.dataTransfer.files[0])
})
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]))
