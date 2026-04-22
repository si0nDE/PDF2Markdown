import { strToU8, zipSync } from 'fflate'

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadMarkdown(markdown, filename) {
  triggerDownload(new Blob([markdown], { type: 'text/markdown' }), filename)
}

export function stripImages(markdown) {
  return markdown
    .split('\n')
    .filter(line => !line.startsWith('<!-- Bild') && !line.startsWith('![Abbildung'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function downloadTextOnly(markdown, filename) {
  downloadMarkdown(stripImages(markdown), filename)
}

export function downloadZip(markdown, filename) {
  const zipped = zipSync({ 'output.md': strToU8(markdown) })
  triggerDownload(
    new Blob([zipped], { type: 'application/zip' }),
    filename.replace(/\.md$/, '.zip')
  )
}

export function downloadSplit(pages, baseName) {
  const files = {}
  pages.forEach((pageMarkdown, idx) => {
    files[`${baseName}-seite-${idx + 1}.md`] = strToU8(pageMarkdown)
  })
  const zipped = zipSync(files)
  triggerDownload(new Blob([zipped], { type: 'application/zip' }), `${baseName}-split.zip`)
}
