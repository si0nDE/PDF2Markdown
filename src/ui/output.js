import { marked } from 'marked'
import { downloadMarkdown, downloadTextOnly, downloadZip, downloadSplit } from '../exporter.js'

const outputSection = document.getElementById('output-section')
const outputPreview = document.getElementById('output-preview')
const outputRaw = document.getElementById('output-raw')
const toggleViewBtn = document.getElementById('toggle-view-btn')
const copyBtn = document.getElementById('copy-btn')
const downloadOptions = document.getElementById('download-options')
const kofiBanner = document.getElementById('kofi-banner')

let isRaw = false
let currentMarkdown = ''

toggleViewBtn.addEventListener('click', () => {
  isRaw = !isRaw
  outputPreview.hidden = isRaw
  outputRaw.hidden = !isRaw
  toggleViewBtn.textContent = isRaw ? 'Vorschau anzeigen' : 'Raw anzeigen'
})

copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(currentMarkdown)
  copyBtn.textContent = 'Kopiert ✓'
  setTimeout(() => { copyBtn.textContent = 'Kopieren' }, 2000)
})

function makeBtn(label, onClick) {
  const btn = document.createElement('button')
  btn.textContent = label
  btn.addEventListener('click', onClick)
  return btn
}

export function showOutput(markdown, sizeInfo) {
  currentMarkdown = markdown
  outputPreview.innerHTML = marked.parse(markdown)
  outputRaw.value = markdown
  outputRaw.hidden = true
  outputPreview.hidden = false
  isRaw = false
  toggleViewBtn.textContent = 'Raw anzeigen'

  downloadOptions.innerHTML = ''
  downloadOptions.appendChild(makeBtn('Download .md', () => downloadMarkdown(markdown, 'output.md')))

  if (sizeInfo.status === 'red') {
    downloadOptions.appendChild(makeBtn('Download ZIP', () => downloadZip(markdown, 'output.md')))
    downloadOptions.appendChild(makeBtn('Aufteilen (ZIP)', () => {
      downloadSplit(markdown.split('\n\n---\n\n'), 'output')
    }))
    downloadOptions.appendChild(makeBtn('Nur Text (ohne Bilder)', () => downloadTextOnly(markdown, 'output-text.md')))
  }

  outputSection.hidden = false
  kofiBanner.hidden = false
}
