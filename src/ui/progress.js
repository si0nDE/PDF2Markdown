const progressSection = document.getElementById('progress-section')
const progressBar = document.getElementById('progress-bar')
const progressStatus = document.getElementById('progress-status')
const outputSection = document.getElementById('output-section')

const MESSAGES = {
  loading: () => 'PDF wird geladen…',
  extracting: (c, t) => `Text wird extrahiert… (Seite ${c}/${t})`,
  ocr: (c, t) => `OCR läuft… (Seite ${c}/${t} — kann etwas dauern)`,
  generating: () => 'Markdown wird generiert…',
}

const WIDTHS = {
  loading: () => 10,
  extracting: (c, t) => 10 + (c / t) * 60,
  ocr: (c, t) => 10 + (c / t) * 60,
  generating: () => 90,
}

export function showProgress() {
  progressSection.hidden = false
  outputSection.hidden = true
  progressBar.style.width = '0%'
  progressStatus.textContent = ''
}

export function updateProgress(step, current, total) {
  const msgFn = MESSAGES[step]
  if (msgFn) progressStatus.textContent = msgFn(current, total)
  const widthFn = WIDTHS[step]
  if (widthFn) progressBar.style.width = `${widthFn(current, total)}%`
}

export function showDone() {
  progressBar.style.width = '100%'
  progressStatus.textContent = 'Fertig! ✓'
}

export function hideProgress() {
  progressSection.hidden = true
}
