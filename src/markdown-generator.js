const BULLET_RE = /^[•\-*–]\s+/
const ORDERED_RE = /^\d+[.)]\s/
const MONOSPACE_NAMES = ['courier', 'monospace', 'inconsolata', 'consolas', 'lucida console']

function isMonospace(fontName) {
  const lower = fontName.toLowerCase()
  return MONOSPACE_NAMES.some(m => lower.includes(m))
}

function medianFontSize(pages) {
  const sizes = []
  for (const page of pages) {
    for (const item of page.items) {
      sizes.push(item.fontSize)
    }
  }
  if (!sizes.length) return 12
  // Use the median to get a robust "body text" baseline
  const sorted = [...sizes].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

function detectRepeated(pages) {
  if (pages.length < 2) return new Set()
  const counts = {}
  for (const page of pages) {
    const seen = new Set()
    for (const item of page.items) {
      if (seen.has(item.text)) continue
      seen.add(item.text)
      counts[item.text] = (counts[item.text] ?? 0) + 1
    }
  }
  return new Set(
    Object.entries(counts)
      .filter(([, n]) => n === pages.length)
      .map(([t]) => t)
  )
}

function renderItem(item, median) {
  const text = item.text.trim()
  if (!text) return null

  const ratio = item.fontSize / median
  if (ratio >= 1.8) return `# ${text}`
  if (ratio >= 1.4) return `## ${text}`
  if (ratio >= 1.2) return `### ${text}`

  if (BULLET_RE.test(text)) return `- ${text.replace(BULLET_RE, '')}`
  if (ORDERED_RE.test(text)) return text

  return text
}

export function generateMarkdown(pages) {
  const repeated = detectRepeated(pages)
  const median = medianFontSize(pages)
  let imageCounter = 1

  const parts = pages.map(page => {
    const lines = []

    const filteredItems = page.items.filter(item => !repeated.has(item.text))
    let i = 0
    while (i < filteredItems.length) {
      const item = filteredItems[i]
      if (isMonospace(item.fontName)) {
        const codeLines = []
        while (i < filteredItems.length && isMonospace(filteredItems[i].fontName)) {
          const t = filteredItems[i].text.trim()
          if (t) codeLines.push(t)
          i++
        }
        lines.push('```\n' + codeLines.join('\n') + '\n```')
      } else {
        const rendered = renderItem(item, median)
        if (rendered) lines.push(rendered)
        i++
      }
    }

    for (const image of page.images) {
      if (image.ocrText) {
        const safeOcr = image.ocrText.replace(/-->/g, '-- >')
        lines.push(`<!-- Bild ${imageCounter}: ${safeOcr} -->`)
      }
      lines.push(`![Abbildung ${imageCounter}](${image.dataUrl})`)
      imageCounter++
    }

    return lines.join('\n')
  })

  return parts.join('\n\n---\n\n')
}
