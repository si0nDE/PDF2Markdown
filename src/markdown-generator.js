const BULLET_RE = /^[•\-*–]\s+/
const ORDERED_RE = /^\d+[.)]\s/
const MONOSPACE_NAMES = ['courier', 'monospace', 'inconsolata', 'consolas', 'lucida console']

function isMonospace(fontName) {
  const lower = fontName.toLowerCase()
  return MONOSPACE_NAMES.some(m => lower.includes(m))
}

function averageFontSize(pages) {
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
    for (const item of page.items) {
      counts[item.text] = (counts[item.text] ?? 0) + 1
    }
  }
  return new Set(
    Object.entries(counts)
      .filter(([, n]) => n === pages.length)
      .map(([t]) => t)
  )
}

function renderItem(item, avg) {
  const text = item.text.trim()
  if (!text) return null

  const ratio = item.fontSize / avg
  if (ratio >= 1.8) return `# ${text}`
  if (ratio >= 1.4) return `## ${text}`
  if (ratio >= 1.2) return `### ${text}`

  if (BULLET_RE.test(text)) return `- ${text.replace(BULLET_RE, '')}`
  if (ORDERED_RE.test(text)) return text
  if (isMonospace(item.fontName)) return `\`\`\`\n${text}\n\`\`\``

  return text
}

export function generateMarkdown(pages) {
  const repeated = detectRepeated(pages)
  const avg = averageFontSize(pages)
  let imageCounter = 1

  const parts = pages.map(page => {
    const lines = []

    for (const item of page.items) {
      if (repeated.has(item.text)) continue
      const rendered = renderItem(item, avg)
      if (rendered) lines.push(rendered)
    }

    for (const image of page.images) {
      if (image.ocrText) {
        lines.push(`<!-- Bild ${imageCounter}: ${image.ocrText} -->`)
      }
      lines.push(`![Abbildung ${imageCounter}](${image.dataUrl})`)
      imageCounter++
    }

    return lines.join('\n')
  })

  return parts.join('\n\n---\n\n')
}
