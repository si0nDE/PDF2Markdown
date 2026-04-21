const GREEN_THRESHOLD = 500 * 1024
const RED_THRESHOLD = 2 * 1024 * 1024

const RECOMMENDATIONS = [
  {
    id: 'zip',
    label: 'ZIP-Export (empfohlen bei bilderlastigen PDFs)',
    description: 'Markdown-Datei + Bilder als separate Dateien',
  },
  {
    id: 'split',
    label: 'Aufteilen',
    description: 'Seiten als einzelne Markdown-Dateien im ZIP',
  },
  {
    id: 'text-only',
    label: 'Nur OCR-Text',
    description: 'Bilder nicht eingebettet, nur extrahierter Text',
  },
]

export function analyzeSize(bytes) {
  const mb = parseFloat((bytes / (1024 * 1024)).toFixed(2))

  if (bytes < GREEN_THRESHOLD) {
    return { status: 'green', bytes, mb }
  }

  if (bytes < RED_THRESHOLD) {
    return {
      status: 'yellow',
      bytes,
      mb,
      warning: 'Markdown-Ausgabe wird token-intensiv für Claude',
    }
  }

  return {
    status: 'red',
    bytes,
    mb,
    warning: 'Markdown-Ausgabe sehr groß — Alternative empfohlen',
    recommendations: RECOMMENDATIONS,
  }
}
