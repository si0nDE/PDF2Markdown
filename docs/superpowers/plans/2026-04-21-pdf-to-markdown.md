# PDF to Markdown Converter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only SPA that converts PDFs (including scanned ones) to Claude-optimized Markdown, with zero server-side processing.

**Architecture:** Three core processing modules (`pdf-extractor`, `ocr-engine`, `markdown-generator`) are orchestrated by a `pipeline` module. A thin UI layer handles upload, progress feedback, and output. Tesseract.js WASM is lazy-loaded only when a scanned page or image is detected.

**Tech Stack:** Vite, Vanilla JavaScript, pdfjs-dist, Tesseract.js, marked, fflate, Vitest

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | App shell — all UI section stubs |
| `src/style.css` | All styling |
| `src/main.js` | App init, event wiring, error handling |
| `src/size-analyzer.js` | File size → `{ status, bytes, mb, warning?, recommendations? }` |
| `src/markdown-generator.js` | `PageData[]` → clean Markdown string |
| `src/pdf-extractor.js` | PDF.js wrapper: text items + images per page |
| `src/ocr-engine.js` | Tesseract.js lazy wrapper: OCR on canvas/image |
| `src/pipeline.js` | Orchestrates extraction + OCR + generation with progress |
| `src/exporter.js` | Download as `.md`, ZIP, split pages, text-only |
| `src/ui/upload.js` | Drop zone, file picker, password input, page range |
| `src/ui/progress.js` | Progress bar + status messages |
| `src/ui/output.js` | Preview, raw toggle, copy, download buttons, ko-fi banner |
| `src/__tests__/size-analyzer.test.js` | |
| `src/__tests__/markdown-generator.test.js` | |
| `src/__tests__/pdf-extractor.test.js` | |
| `src/__tests__/ocr-engine.test.js` | |
| `src/__tests__/pipeline.test.js` | |
| `src/__tests__/exporter.test.js` | |

---

### Task 0: Project Setup

**Goal:** Working Vite project with Vitest, all dependencies installed, dev/test/build scripts functional.

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`

**Acceptance Criteria:**
- [ ] `npm run dev` starts dev server on localhost:5173
- [ ] `npm run test` runs Vitest and exits 0
- [ ] `npm run build` produces `dist/`

**Verify:** `npm run test` → `No test files found` (exit 0)

**Steps:**

- [ ] **Step 1: Create package.json**

```json
{
  "name": "markdown2pdf",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "fflate": "^0.8.2",
    "marked": "^12.0.0",
    "pdfjs-dist": "^4.4.168",
    "tesseract.js": "^5.1.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "vitest": "^1.6.0",
    "jsdom": "^24.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  worker: {
    format: 'es',
  },
})
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PDF → Markdown</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <div id="app">
    <header>
      <h1>PDF → Markdown</h1>
      <p>Browser-basiert · Datenschutzfreundlich · Für Claude optimiert</p>
    </header>

    <section id="upload-section">
      <div id="drop-zone">
        <p>PDF hier ablegen oder</p>
        <label for="file-input">Datei auswählen</label>
        <input type="file" id="file-input" accept=".pdf" />
      </div>
      <div id="file-info" hidden>
        <span id="file-name"></span>
        <span id="page-count"></span>
        <div id="size-indicator" class="indicator"></div>
      </div>
      <div id="page-range" hidden>
        <label>Seitenbereich (PDF hat über 100 Seiten):</label>
        <input type="number" id="range-start" min="1" placeholder="Von" />
        <span>–</span>
        <input type="number" id="range-end" min="1" placeholder="Bis" />
      </div>
      <div id="password-section" hidden>
        <label for="pdf-password">PDF ist passwortgeschützt:</label>
        <input type="password" id="pdf-password" placeholder="Passwort eingeben" />
        <button id="unlock-btn">Entsperren</button>
        <span id="password-error" hidden style="color:red">Falsches Passwort</span>
      </div>
      <button id="convert-btn" hidden>Konvertieren</button>
    </section>

    <section id="progress-section" hidden>
      <div id="progress-bar-container">
        <div id="progress-bar"></div>
      </div>
      <p id="progress-status"></p>
    </section>

    <section id="output-section" hidden>
      <div id="output-controls">
        <button id="toggle-view-btn">Raw anzeigen</button>
        <button id="copy-btn">Kopieren</button>
        <div id="download-options"></div>
      </div>
      <div id="output-preview"></div>
      <textarea id="output-raw" hidden></textarea>
    </section>

    <div id="kofi-banner" hidden>
      <p>Hat dir das Tool geholfen? Unterstütze die Entwicklung ☕</p>
      <a href="https://ko-fi.com/" target="_blank" rel="noopener">Auf Ko-fi unterstützen →</a>
    </div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create src/main.js stub**

```js
console.log('PDF→Markdown ready')
```

- [ ] **Step 5: Install dependencies and verify**

```bash
npm install
npm run dev
```
Expected: server starts at http://localhost:5173

```bash
npm run test
```
Expected: `No test files found` (exit 0)

- [ ] **Step 6: Commit**

```bash
git init
git add package.json vite.config.js index.html src/main.js
git commit -m "feat: initial project setup with Vite and Vitest"
```

---

### Task 1: Size Analyzer

**Goal:** Pure function classifying output file size with status and recommendations.

**Files:**
- Create: `src/size-analyzer.js`
- Create: `src/__tests__/size-analyzer.test.js`

**Acceptance Criteria:**
- [ ] Returns `{ status: 'green', bytes, mb }` for files < 500 KB
- [ ] Returns `{ status: 'yellow', bytes, mb, warning }` for 500 KB–2 MB
- [ ] Returns `{ status: 'red', bytes, mb, warning, recommendations }` for > 2 MB
- [ ] `recommendations` has exactly 3 items with ids `zip`, `split`, `text-only`
- [ ] `mb` rounded to 2 decimal places

**Verify:** `npm run test src/__tests__/size-analyzer.test.js` → 3 tests pass

**Steps:**

- [ ] **Step 1: Write failing tests**

```js
// src/__tests__/size-analyzer.test.js
import { analyzeSize } from '../size-analyzer.js'

const KB = 1024
const MB = 1024 * 1024

test('green for files under 500KB', () => {
  const result = analyzeSize(400 * KB)
  expect(result.status).toBe('green')
  expect(result.bytes).toBe(400 * KB)
  expect(result.mb).toBe(0.39)
  expect(result.warning).toBeUndefined()
  expect(result.recommendations).toBeUndefined()
})

test('yellow for files between 500KB and 2MB', () => {
  const result = analyzeSize(1 * MB)
  expect(result.status).toBe('yellow')
  expect(result.warning).toMatch(/token-intensiv/)
  expect(result.recommendations).toBeUndefined()
})

test('red with 3 recommendations for files over 2MB', () => {
  const result = analyzeSize(3 * MB)
  expect(result.status).toBe('red')
  expect(result.warning).toBeDefined()
  expect(result.recommendations).toHaveLength(3)
  expect(result.recommendations.map(r => r.id)).toEqual(['zip', 'split', 'text-only'])
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test src/__tests__/size-analyzer.test.js
```
Expected: FAIL — `Cannot find module '../size-analyzer.js'`

- [ ] **Step 3: Implement src/size-analyzer.js**

```js
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
  const mb = Math.round((bytes / (1024 * 1024)) * 100) / 100

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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test src/__tests__/size-analyzer.test.js
```
Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/size-analyzer.js src/__tests__/size-analyzer.test.js
git commit -m "feat: add size-analyzer with green/yellow/red thresholds"
```

---

### Task 2: Markdown Generator

**Goal:** Pure function converting extracted page data into clean Markdown.

**Files:**
- Create: `src/markdown-generator.js`
- Create: `src/__tests__/markdown-generator.test.js`

**Data types used throughout this task and all subsequent tasks:**

```js
// PageData
{
  pageNum: number,
  items: TextItem[],
  images: ImageData[],
}

// TextItem
{
  text: string,      // content
  fontSize: number,  // absolute size in points
  fontName: string,  // e.g. 'Arial', 'Courier'
  x: number,
  y: number,
}

// ImageData
{
  dataUrl: string,       // 'data:image/png;base64,...'
  ocrText: string|null,  // null until OCR runs
}
```

**Acceptance Criteria:**
- [ ] Items with `fontSize > avgFontSize * 1.8` → `# heading`
- [ ] Items with `fontSize > avgFontSize * 1.4` → `## heading`
- [ ] Items with `fontSize > avgFontSize * 1.2` → `### heading`
- [ ] Items starting with `•`, `-`, `*`, `–` → `- item`
- [ ] Items starting with `digit.` or `digit)` → preserved as-is (ordered list)
- [ ] Items with monospace font name → fenced code block
- [ ] Text repeated on every page → removed (header/footer detection)
- [ ] Pages separated by `\n\n---\n\n`
- [ ] Images: global counter across pages, `<!-- Bild N: ocrText -->` + `![Abbildung N](dataUrl)`
- [ ] Images with `ocrText: null` → no comment, just `![Abbildung N](...)`

**Verify:** `npm run test src/__tests__/markdown-generator.test.js` → 11 tests pass

**Steps:**

- [ ] **Step 1: Write failing tests**

```js
// src/__tests__/markdown-generator.test.js
import { generateMarkdown } from '../markdown-generator.js'

function item(text, fontSize = 12, fontName = 'Arial') {
  return { text, fontSize, fontName, x: 0, y: 0 }
}

test('renders normal text', () => {
  const pages = [{ pageNum: 1, items: [item('Hello world')], images: [] }]
  expect(generateMarkdown(pages)).toContain('Hello world')
})

test('large font → H1', () => {
  const pages = [{
    pageNum: 1,
    items: [item('Big Title', 24), item('normal', 12), item('normal', 12)],
    images: [],
  }]
  expect(generateMarkdown(pages)).toMatch(/^# Big Title/m)
})

test('medium-large font → H2', () => {
  const pages = [{
    pageNum: 1,
    items: [item('Section', 18), item('normal', 12), item('normal', 12)],
    images: [],
  }]
  expect(generateMarkdown(pages)).toMatch(/^## Section/m)
})

test('bullet items → markdown list', () => {
  const pages = [{
    pageNum: 1,
    items: [item('• First'), item('• Second')],
    images: [],
  }]
  const result = generateMarkdown(pages)
  expect(result).toContain('- First')
  expect(result).toContain('- Second')
})

test('numbered items preserved', () => {
  const pages = [{
    pageNum: 1,
    items: [item('1. Alpha'), item('2. Beta')],
    images: [],
  }]
  const result = generateMarkdown(pages)
  expect(result).toContain('1. Alpha')
  expect(result).toContain('2. Beta')
})

test('monospace font → fenced code block', () => {
  const pages = [{
    pageNum: 1,
    items: [item('const x = 1', 12, 'Courier')],
    images: [],
  }]
  expect(generateMarkdown(pages)).toContain('```\nconst x = 1\n```')
})

test('text on every page removed as header/footer', () => {
  const pages = [
    { pageNum: 1, items: [item('ACME Corp'), item('Content 1')], images: [] },
    { pageNum: 2, items: [item('ACME Corp'), item('Content 2')], images: [] },
    { pageNum: 3, items: [item('ACME Corp'), item('Content 3')], images: [] },
  ]
  const result = generateMarkdown(pages)
  expect(result).not.toContain('ACME Corp')
  expect(result).toContain('Content 1')
})

test('pages separated by ---', () => {
  const pages = [
    { pageNum: 1, items: [item('Page one')], images: [] },
    { pageNum: 2, items: [item('Page two')], images: [] },
  ]
  expect(generateMarkdown(pages)).toContain('\n\n---\n\n')
})

test('image with ocrText → comment + img tag', () => {
  const pages = [{
    pageNum: 1,
    items: [],
    images: [{ dataUrl: 'data:image/png;base64,abc', ocrText: 'chart title' }],
  }]
  const result = generateMarkdown(pages)
  expect(result).toContain('<!-- Bild 1: chart title -->')
  expect(result).toContain('![Abbildung 1](data:image/png;base64,abc)')
})

test('image without ocrText → no comment', () => {
  const pages = [{
    pageNum: 1,
    items: [],
    images: [{ dataUrl: 'data:image/png;base64,xyz', ocrText: null }],
  }]
  const result = generateMarkdown(pages)
  expect(result).not.toContain('<!--')
  expect(result).toContain('![Abbildung 1](data:image/png;base64,xyz)')
})

test('image counter is global across pages', () => {
  const pages = [
    { pageNum: 1, items: [], images: [{ dataUrl: 'data:image/png;base64,a', ocrText: null }] },
    { pageNum: 2, items: [], images: [{ dataUrl: 'data:image/png;base64,b', ocrText: null }] },
  ]
  const result = generateMarkdown(pages)
  expect(result).toContain('![Abbildung 1]')
  expect(result).toContain('![Abbildung 2]')
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test src/__tests__/markdown-generator.test.js
```
Expected: FAIL — `Cannot find module '../markdown-generator.js'`

- [ ] **Step 3: Implement src/markdown-generator.js**

```js
const BULLET_RE = /^[•\-*–]\s+/
const ORDERED_RE = /^\d+[.)]\s/
const MONOSPACE_NAMES = ['courier', 'monospace', 'inconsolata', 'consolas', 'lucida console']

function isMonospace(fontName) {
  const lower = fontName.toLowerCase()
  return MONOSPACE_NAMES.some(m => lower.includes(m))
}

function averageFontSize(pages) {
  let sum = 0
  let count = 0
  for (const page of pages) {
    for (const item of page.items) {
      sum += item.fontSize
      count++
    }
  }
  return count ? sum / count : 12
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test src/__tests__/markdown-generator.test.js
```
Expected: 11 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/markdown-generator.js src/__tests__/markdown-generator.test.js
git commit -m "feat: add markdown-generator with heading/list/code/image/footer detection"
```

---

### Task 3: PDF Extractor

**Goal:** PDF.js wrapper extracting text items (with position and font) and embedded images per page.

**Files:**
- Create: `src/pdf-extractor.js`
- Create: `src/__tests__/pdf-extractor.test.js`

**Acceptance Criteria:**
- [ ] `loadPDF(file, password?)` returns `{ doc, numPages }`
- [ ] `loadPDF` passes `password` to `pdfjs.getDocument` only when provided
- [ ] `loadPDF` throws `{ code: 'PASSWORD_REQUIRED' }` for password-protected PDFs
- [ ] `extractPage(doc, pageNum)` returns `{ pageNum, items, images, rawTextLength }`
- [ ] `items` shape: `{ text, fontSize, fontName, x, y }`
- [ ] `rawTextLength` = total character count across all items
- [ ] `images` initially have `ocrText: null`
- [ ] Corrupt page → `{ pageNum, items: [], images: [], rawTextLength: 0, error: 'corrupt' }`

**Verify:** `npm run test src/__tests__/pdf-extractor.test.js` → all tests pass

**Steps:**

- [ ] **Step 1: Write failing tests**

```js
// src/__tests__/pdf-extractor.test.js
import { vi, describe, test, expect, beforeEach } from 'vitest'

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}))

import * as pdfjs from 'pdfjs-dist'
import { loadPDF, extractPage } from '../pdf-extractor.js'

function makeMockPage(textItems = []) {
  return {
    getTextContent: vi.fn().mockResolvedValue({ items: textItems }),
    getOperatorList: vi.fn().mockResolvedValue({ fnArray: [], argsArray: [] }),
    getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 }),
    render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
  }
}

function makeMockDoc(pages = []) {
  return {
    numPages: pages.length,
    getPage: vi.fn((n) => Promise.resolve(pages[n - 1])),
  }
}

describe('loadPDF', () => {
  test('returns doc and numPages', async () => {
    const mockDoc = makeMockDoc([makeMockPage(), makeMockPage()])
    pdfjs.getDocument.mockReturnValue({ promise: Promise.resolve(mockDoc) })

    const file = new File(['%PDF'], 'test.pdf', { type: 'application/pdf' })
    const result = await loadPDF(file)

    expect(result.numPages).toBe(2)
    expect(result.doc).toBe(mockDoc)
  })

  test('throws PASSWORD_REQUIRED for protected PDF', async () => {
    pdfjs.getDocument.mockReturnValue({
      promise: Promise.reject(new Error('No password given')),
    })

    const file = new File(['%PDF'], 'secret.pdf', { type: 'application/pdf' })
    await expect(loadPDF(file)).rejects.toMatchObject({ code: 'PASSWORD_REQUIRED' })
  })

  test('passes password to getDocument', async () => {
    const mockDoc = makeMockDoc([makeMockPage()])
    pdfjs.getDocument.mockReturnValue({ promise: Promise.resolve(mockDoc) })

    const file = new File(['%PDF'], 'test.pdf', { type: 'application/pdf' })
    await loadPDF(file, 'secret123')

    expect(pdfjs.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'secret123' })
    )
  })
})

describe('extractPage', () => {
  beforeEach(() => vi.clearAllMocks())

  test('extracts text items with fontSize and fontName', async () => {
    const textItems = [
      { str: 'Hello', transform: [14, 0, 0, 14, 10, 20], fontName: 'TimesNewRoman' },
    ]
    const doc = makeMockDoc([makeMockPage(textItems)])

    const result = await extractPage(doc, 1)

    expect(result.pageNum).toBe(1)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ text: 'Hello', fontSize: 14, fontName: 'TimesNewRoman', x: 10, y: 20 })
  })

  test('computes rawTextLength', async () => {
    const textItems = [
      { str: 'Hello', transform: [12, 0, 0, 12, 0, 0], fontName: 'Arial' },
      { str: ' World', transform: [12, 0, 0, 12, 0, 0], fontName: 'Arial' },
    ]
    const doc = makeMockDoc([makeMockPage(textItems)])

    const result = await extractPage(doc, 1)
    expect(result.rawTextLength).toBe(11)
  })

  test('images start with ocrText: null', async () => {
    const doc = makeMockDoc([makeMockPage()])
    const result = await extractPage(doc, 1)
    expect(result.images).toEqual([])
  })

  test('returns corrupt error for failed pages', async () => {
    const doc = {
      numPages: 1,
      getPage: vi.fn().mockRejectedValue(new Error('stream error')),
    }

    const result = await extractPage(doc, 1)
    expect(result.error).toBe('corrupt')
    expect(result.items).toEqual([])
    expect(result.images).toEqual([])
    expect(result.rawTextLength).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test src/__tests__/pdf-extractor.test.js
```
Expected: FAIL — `Cannot find module '../pdf-extractor.js'`

- [ ] **Step 3: Implement src/pdf-extractor.js**

```js
import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export async function loadPDF(file, password = '') {
  const arrayBuffer = await file.arrayBuffer()
  const params = { data: arrayBuffer }
  if (password) params.password = password

  const task = pdfjs.getDocument(params)
  try {
    const doc = await task.promise
    return { doc, numPages: doc.numPages }
  } catch (err) {
    const msg = err.message?.toLowerCase() ?? ''
    if (msg.includes('password')) throw { code: 'PASSWORD_REQUIRED' }
    throw err
  }
}

export async function extractPage(doc, pageNum) {
  try {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()

    const items = content.items.map(item => ({
      text: item.str,
      fontSize: Math.abs(item.transform[0]),
      fontName: item.fontName ?? 'unknown',
      x: item.transform[4],
      y: item.transform[5],
    }))

    const rawTextLength = items.reduce((sum, i) => sum + i.text.length, 0)
    const images = await extractImages(page)

    return { pageNum, items, images, rawTextLength }
  } catch {
    return { pageNum, items: [], images: [], rawTextLength: 0, error: 'corrupt' }
  }
}

async function extractImages(page) {
  const opList = await page.getOperatorList()
  // PDF.js OPS.paintImageXObject = 85
  const hasImage = opList.fnArray.includes(85)
  if (!hasImage) return []

  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise

  return [{ dataUrl: canvas.toDataURL('image/png'), ocrText: null }]
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test src/__tests__/pdf-extractor.test.js
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/pdf-extractor.js src/__tests__/pdf-extractor.test.js
git commit -m "feat: add pdf-extractor with PDF.js, text extraction and image detection"
```

---

### Task 4: OCR Engine

**Goal:** Lazy-loaded Tesseract.js wrapper — WASM worker created only on first use.

**Files:**
- Create: `src/ocr-engine.js`
- Create: `src/__tests__/ocr-engine.test.js`

**Acceptance Criteria:**
- [ ] `createWorker` (Tesseract) not called until first `ocrImage()` call
- [ ] Worker reused across subsequent calls
- [ ] `ocrImage(dataUrl)` returns trimmed OCR text string
- [ ] `ocrPage(canvas)` delegates to `ocrImage(canvas.toDataURL('image/png'))`
- [ ] `teardown()` terminates worker and resets internal reference to null
- [ ] Throws `{ code: 'OCR_UNAVAILABLE', message }` when worker creation fails

**Verify:** `npm run test src/__tests__/ocr-engine.test.js` → all tests pass

**Steps:**

- [ ] **Step 1: Write failing tests**

```js
// src/__tests__/ocr-engine.test.js
import { vi, test, expect, beforeEach } from 'vitest'

const mockWorker = {
  recognize: vi.fn().mockResolvedValue({ data: { text: '  recognized text  ' } }),
  terminate: vi.fn().mockResolvedValue(undefined),
}

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn().mockResolvedValue(mockWorker),
}))

import * as Tesseract from 'tesseract.js'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

test('worker not created on import', async () => {
  await import('../ocr-engine.js')
  expect(Tesseract.createWorker).not.toHaveBeenCalled()
})

test('worker created on first ocrImage call', async () => {
  const { ocrImage } = await import('../ocr-engine.js')
  await ocrImage('data:image/png;base64,abc')
  expect(Tesseract.createWorker).toHaveBeenCalledTimes(1)
})

test('worker reused on subsequent calls', async () => {
  const { ocrImage } = await import('../ocr-engine.js')
  await ocrImage('data:image/png;base64,a')
  await ocrImage('data:image/png;base64,b')
  expect(Tesseract.createWorker).toHaveBeenCalledTimes(1)
})

test('ocrImage returns trimmed text', async () => {
  const { ocrImage } = await import('../ocr-engine.js')
  const result = await ocrImage('data:image/png;base64,abc')
  expect(result).toBe('recognized text')
})

test('teardown terminates worker', async () => {
  const { ocrImage, teardown } = await import('../ocr-engine.js')
  await ocrImage('data:image/png;base64,abc')
  await teardown()
  expect(mockWorker.terminate).toHaveBeenCalled()
})

test('throws OCR_UNAVAILABLE when worker creation fails', async () => {
  Tesseract.createWorker.mockRejectedValueOnce(new Error('network error'))
  const { ocrImage } = await import('../ocr-engine.js')
  await expect(ocrImage('data:image/png;base64,abc')).rejects.toMatchObject({
    code: 'OCR_UNAVAILABLE',
    message: 'network error',
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test src/__tests__/ocr-engine.test.js
```
Expected: FAIL — `Cannot find module '../ocr-engine.js'`

- [ ] **Step 3: Implement src/ocr-engine.js**

```js
import { createWorker } from 'tesseract.js'

let worker = null

async function getWorker() {
  if (worker) return worker
  try {
    worker = await createWorker('deu+eng')
    return worker
  } catch (err) {
    throw { code: 'OCR_UNAVAILABLE', message: err.message }
  }
}

export async function ocrImage(dataUrl) {
  const w = await getWorker()
  const { data } = await w.recognize(dataUrl)
  return data.text.trim()
}

export async function ocrPage(canvas) {
  return ocrImage(canvas.toDataURL('image/png'))
}

export async function teardown() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test src/__tests__/ocr-engine.test.js
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/ocr-engine.js src/__tests__/ocr-engine.test.js
git commit -m "feat: add ocr-engine with lazy Tesseract.js worker initialization"
```

---

### Task 5: Conversion Pipeline

**Goal:** Orchestrates PDF extraction → OCR → Markdown generation with per-step progress callbacks.

**Files:**
- Create: `src/pipeline.js`
- Create: `src/__tests__/pipeline.test.js`

**Acceptance Criteria:**
- [ ] `convertPDF(file, options, onProgress)` returns `{ markdown, sizeInfo, pageCount }`
- [ ] `onProgress(step, current, total)` called with steps: `'loading'`, `'extracting'`, `'ocr'`, `'generating'`
- [ ] Pages with `rawTextLength < 50` trigger `ocrPage`, replacing items with single OCR text item
- [ ] Pages with `rawTextLength >= 50` do not trigger `ocrPage`
- [ ] Each image in a page has `ocrImage` called, result stored in `image.ocrText`
- [ ] Corrupt pages get placeholder item `{ text: '[Seite N konnte nicht verarbeitet werden]', fontSize: 12, fontName: 'Arial', x: 0, y: 0 }`
- [ ] `options.pageRange = { start, end }` limits extraction to those page numbers (inclusive)
- [ ] `options.password` forwarded to `loadPDF`

**Verify:** `npm run test src/__tests__/pipeline.test.js` → all tests pass

**Steps:**

- [ ] **Step 1: Write failing tests**

```js
// src/__tests__/pipeline.test.js
import { vi, test, expect, beforeEach } from 'vitest'

vi.mock('../pdf-extractor.js', () => ({
  loadPDF: vi.fn(),
  extractPage: vi.fn(),
}))
vi.mock('../ocr-engine.js', () => ({
  ocrImage: vi.fn().mockResolvedValue('ocr text'),
  ocrPage: vi.fn().mockResolvedValue('scanned page text'),
  teardown: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../markdown-generator.js', () => ({
  generateMarkdown: vi.fn().mockReturnValue('# Generated'),
}))
vi.mock('../size-analyzer.js', () => ({
  analyzeSize: vi.fn().mockReturnValue({ status: 'green', bytes: 100, mb: 0 }),
}))

import { loadPDF, extractPage } from '../pdf-extractor.js'
import { ocrPage, ocrImage } from '../ocr-engine.js'
import { generateMarkdown } from '../markdown-generator.js'
import { convertPDF } from '../pipeline.js'

const mockFile = new File(['%PDF'], 'test.pdf')

function textPage(rawTextLength = 100) {
  return {
    pageNum: 1,
    items: [{ text: 'x'.repeat(rawTextLength), fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
    images: [],
    rawTextLength,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  loadPDF.mockResolvedValue({ doc: {}, numPages: 1 })
})

test('calls onProgress for loading, extracting, generating', async () => {
  extractPage.mockResolvedValue(textPage(60))
  const steps = []
  await convertPDF(mockFile, {}, (step) => steps.push(step))
  expect(steps).toContain('loading')
  expect(steps).toContain('extracting')
  expect(steps).toContain('generating')
})

test('scanned page (rawTextLength < 50) triggers ocrPage', async () => {
  extractPage.mockResolvedValue({ pageNum: 1, items: [], images: [], rawTextLength: 10 })
  await convertPDF(mockFile, {}, () => {})
  expect(ocrPage).toHaveBeenCalled()
})

test('text page (rawTextLength >= 50) skips ocrPage', async () => {
  extractPage.mockResolvedValue(textPage(60))
  await convertPDF(mockFile, {}, () => {})
  expect(ocrPage).not.toHaveBeenCalled()
})

test('image ocrText populated via ocrImage', async () => {
  ocrImage.mockResolvedValue('chart revenue')
  extractPage.mockResolvedValue({
    pageNum: 1,
    items: [{ text: 'x'.repeat(60), fontSize: 12, fontName: 'Arial', x: 0, y: 0 }],
    images: [{ dataUrl: 'data:image/png;base64,abc', ocrText: null }],
    rawTextLength: 60,
  })
  await convertPDF(mockFile, {}, () => {})
  const pagesArg = generateMarkdown.mock.calls[0][0]
  expect(pagesArg[0].images[0].ocrText).toBe('chart revenue')
})

test('corrupt page gets placeholder item', async () => {
  extractPage.mockResolvedValue({ pageNum: 1, items: [], images: [], rawTextLength: 0, error: 'corrupt' })
  await convertPDF(mockFile, {}, () => {})
  const pagesArg = generateMarkdown.mock.calls[0][0]
  expect(pagesArg[0].items[0].text).toBe('[Seite 1 konnte nicht verarbeitet werden]')
})

test('pageRange limits extraction to correct pages', async () => {
  loadPDF.mockResolvedValue({ doc: {}, numPages: 10 })
  extractPage.mockResolvedValue(textPage(60))
  await convertPDF(mockFile, { pageRange: { start: 3, end: 5 } }, () => {})
  expect(extractPage).toHaveBeenCalledTimes(3)
})

test('returns markdown, sizeInfo, pageCount', async () => {
  extractPage.mockResolvedValue(textPage(60))
  generateMarkdown.mockReturnValue('# Result')
  const result = await convertPDF(mockFile, {}, () => {})
  expect(result.markdown).toBe('# Result')
  expect(result.sizeInfo).toBeDefined()
  expect(result.pageCount).toBe(1)
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test src/__tests__/pipeline.test.js
```
Expected: FAIL — `Cannot find module '../pipeline.js'`

- [ ] **Step 3: Implement src/pipeline.js**

```js
import { loadPDF, extractPage } from './pdf-extractor.js'
import { ocrImage, ocrPage, teardown as teardownOCR } from './ocr-engine.js'
import { generateMarkdown } from './markdown-generator.js'
import { analyzeSize } from './size-analyzer.js'

const SCANNED_THRESHOLD = 50

export async function convertPDF(file, options = {}, onProgress = () => {}) {
  const { pageRange, password } = options

  onProgress('loading', 0, 1)
  const { doc, numPages } = await loadPDF(file, password)
  onProgress('loading', 1, 1)

  const startPage = pageRange?.start ?? 1
  const endPage = pageRange?.end ?? numPages
  const total = endPage - startPage + 1
  const allPageData = []

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const current = pageNum - startPage + 1
    onProgress('extracting', current, total)

    const pageData = await extractPage(doc, pageNum)

    if (pageData.error === 'corrupt') {
      allPageData.push({
        pageNum,
        items: [{
          text: `[Seite ${pageNum} konnte nicht verarbeitet werden]`,
          fontSize: 12,
          fontName: 'Arial',
          x: 0,
          y: 0,
        }],
        images: [],
      })
      continue
    }

    if (pageData.rawTextLength < SCANNED_THRESHOLD) {
      onProgress('ocr', current, total)
      const canvas = await renderPageToCanvas(doc, pageNum)
      const text = await ocrPage(canvas)
      pageData.items = [{ text, fontSize: 12, fontName: 'Arial', x: 0, y: 0 }]
    }

    for (const image of pageData.images) {
      onProgress('ocr', current, total)
      image.ocrText = await ocrImage(image.dataUrl)
    }

    allPageData.push(pageData)
  }

  onProgress('generating', 0, 1)
  const markdown = generateMarkdown(allPageData)
  onProgress('generating', 1, 1)

  const bytes = new TextEncoder().encode(markdown).length
  const sizeInfo = analyzeSize(bytes)

  await teardownOCR()

  return { markdown, sizeInfo, pageCount: numPages }
}

async function renderPageToCanvas(doc, pageNum) {
  const page = await doc.getPage(pageNum)
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
  return canvas
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test src/__tests__/pipeline.test.js
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/pipeline.js src/__tests__/pipeline.test.js
git commit -m "feat: add conversion pipeline with OCR fallback and progress callbacks"
```

---

### Task 6: Exporter

**Goal:** Download helpers for `.md`, ZIP archive, split pages, and text-only (images stripped).

**Files:**
- Create: `src/exporter.js`
- Create: `src/__tests__/exporter.test.js`

**Acceptance Criteria:**
- [ ] `downloadMarkdown(markdown, filename)` triggers anchor click with correct filename
- [ ] `stripImages(markdown)` removes `<!-- Bild ... -->` lines and `![Abbildung ...]()` lines
- [ ] `downloadTextOnly(markdown, filename)` strips images then downloads
- [ ] `downloadZip(markdown, filename)` creates ZIP containing `output.md`, triggers download with `.zip` extension
- [ ] `downloadSplit(pages, baseName)` creates ZIP with one file per page named `baseName-seite-N.md`

**Verify:** `npm run test src/__tests__/exporter.test.js` → all tests pass

**Steps:**

- [ ] **Step 1: Write failing tests**

```js
// src/__tests__/exporter.test.js
import { vi, test, expect, beforeEach } from 'vitest'

const mockClick = vi.fn()
const mockAnchor = { href: '', download: '', click: mockClick }

vi.spyOn(document, 'createElement').mockImplementation((tag) => {
  if (tag === 'a') return mockAnchor
  return {}
})
vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

beforeEach(() => vi.clearAllMocks())

import { downloadMarkdown, stripImages, downloadTextOnly } from '../exporter.js'

test('downloadMarkdown sets filename and clicks anchor', () => {
  downloadMarkdown('# Hello', 'output.md')
  expect(mockAnchor.download).toBe('output.md')
  expect(mockClick).toHaveBeenCalled()
})

test('stripImages removes comment and img lines', () => {
  const input = [
    '# Title',
    '',
    '<!-- Bild 1: chart showing revenue -->',
    '![Abbildung 1](data:image/png;base64,abc)',
    '',
    'Normal paragraph',
  ].join('\n')

  const result = stripImages(input)
  expect(result).not.toContain('<!-- Bild')
  expect(result).not.toContain('![Abbildung')
  expect(result).toContain('# Title')
  expect(result).toContain('Normal paragraph')
})

test('downloadTextOnly strips images before triggering download', () => {
  const markdown = 'Text\n\n![Abbildung 1](data:image/png;base64,abc)'
  downloadTextOnly(markdown, 'text-only.md')
  expect(mockAnchor.download).toBe('text-only.md')
  expect(mockClick).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test src/__tests__/exporter.test.js
```
Expected: FAIL — `Cannot find module '../exporter.js'`

- [ ] **Step 3: Implement src/exporter.js**

```js
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test src/__tests__/exporter.test.js
```
Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/exporter.js src/__tests__/exporter.test.js
git commit -m "feat: add exporter with markdown, zip, split, and text-only download"
```

---

### Task 7: Styling

**Goal:** Complete CSS for all UI sections.

**Files:**
- Create: `src/style.css`

**Acceptance Criteria:**
- [ ] Drop zone has dashed border, hover/dragover highlight
- [ ] `.green` / `.yellow` / `.red` classes on `#size-indicator` render correct colors
- [ ] `#progress-bar` width transition is smooth (`transition: width 0.35s ease`)
- [ ] Output preview area scrolls independently (max-height + overflow-y: auto)
- [ ] Ko-fi banner is visually distinct but unobtrusive
- [ ] Single-column layout on screens ≤ 600px

**Verify:** `npm run dev` → http://localhost:5173 → all sections visible and styled correctly.

**Steps:**

- [ ] **Step 1: Create src/style.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f9fafb;
  color: #111827;
  line-height: 1.6;
  padding: 1rem;
}

#app { max-width: 860px; margin: 0 auto; }

header { text-align: center; padding: 2rem 0 1.5rem; }
header h1 { font-size: 2rem; font-weight: 700; }
header p { color: #6b7280; margin-top: 0.25rem; font-size: 0.95rem; }

/* ── Upload ── */

#drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s, background 0.2s;
}
#drop-zone.dragover { border-color: #4f46e5; background: #eef2ff; }
#drop-zone p { color: #6b7280; margin-bottom: 0.5rem; }
#drop-zone label { color: #4f46e5; cursor: pointer; text-decoration: underline; font-weight: 500; }
#file-input { display: none; }

#file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  font-size: 0.95rem;
}
#file-name { font-weight: 600; }
#page-count { color: #6b7280; }

.indicator {
  padding: 0.2rem 0.7rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 700;
}
.indicator.green { background: #d1fae5; color: #065f46; }
.indicator.yellow { background: #fef3c7; color: #92400e; }
.indicator.red { background: #fee2e2; color: #991b1b; }

#page-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.9rem;
  flex-wrap: wrap;
}
#page-range input[type="number"] {
  width: 80px;
  padding: 0.3rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
}

#password-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}
#pdf-password {
  padding: 0.3rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
}
#unlock-btn {
  padding: 0.3rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}
#unlock-btn:hover { background: #e5e7eb; }

#convert-btn {
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.75rem 3rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
#convert-btn:hover { background: #4338ca; }

/* ── Progress ── */

#progress-section { margin-top: 2rem; }

#progress-bar-container {
  background: #e5e7eb;
  border-radius: 99px;
  height: 10px;
  overflow: hidden;
}
#progress-bar {
  height: 100%;
  width: 0%;
  background: #4f46e5;
  border-radius: 99px;
  transition: width 0.35s ease;
}
#progress-status { margin-top: 0.6rem; color: #6b7280; font-size: 0.9rem; }

/* ── Output ── */

#output-section { margin-top: 2rem; }

#output-controls {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
#output-controls button {
  padding: 0.4rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s;
}
#output-controls button:hover { background: #f3f4f6; }

#download-options { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-left: auto; }
#download-options button { background: #f0fdf4; border-color: #86efac; color: #166534; }
#download-options button:hover { background: #dcfce7; }

#output-preview {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem 2rem;
  background: #fff;
  max-height: 65vh;
  overflow-y: auto;
  font-size: 0.95rem;
}
#output-preview h1 { font-size: 1.6rem; margin: 1.25rem 0 0.5rem; }
#output-preview h2 { font-size: 1.3rem; margin: 1rem 0 0.4rem; }
#output-preview h3 { font-size: 1.1rem; margin: 0.75rem 0 0.3rem; }
#output-preview p { margin-bottom: 0.75rem; }
#output-preview ul, #output-preview ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
#output-preview pre { background: #f3f4f6; padding: 0.75rem 1rem; border-radius: 4px; overflow-x: auto; }
#output-preview table { border-collapse: collapse; width: 100%; margin-bottom: 0.75rem; }
#output-preview th, #output-preview td { border: 1px solid #e5e7eb; padding: 0.35rem 0.7rem; text-align: left; }
#output-preview th { background: #f9fafb; font-weight: 600; }
#output-preview img { max-width: 100%; border-radius: 4px; margin: 0.5rem 0; }
#output-preview hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }

#output-raw {
  width: 100%;
  height: 65vh;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 0.825rem;
  line-height: 1.5;
  resize: vertical;
  background: #fafafa;
}

/* ── Ko-fi ── */

#kofi-banner {
  margin-top: 2rem;
  padding: 0.875rem 1.25rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}
#kofi-banner a { color: #ea580c; font-weight: 600; text-decoration: none; }
#kofi-banner a:hover { text-decoration: underline; }

/* ── Responsive ── */

@media (max-width: 600px) {
  #output-controls { flex-direction: column; align-items: flex-start; }
  #download-options { margin-left: 0; }
  #convert-btn { width: 100%; }
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```
Open http://localhost:5173 — verify drop zone styled, size indicator color classes distinguishable, progress bar container visible.

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: add complete UI styling with responsive layout"
```

---

### Task 8: Upload UI Module

**Goal:** Drop zone, file picker, password handling, page range, and convert button visibility logic.

**Files:**
- Create: `src/ui/upload.js`

**Acceptance Criteria:**
- [ ] Dragging PDF onto drop zone loads it; non-PDF files ignored
- [ ] File picker (`#file-input`) selects PDF
- [ ] On file load: `#file-info` shown with filename, size indicator class set correctly
- [ ] PDF > 100 pages: `#page-range` shown, `range-end` pre-filled with `min(numPages, 50)`
- [ ] Password-protected PDF: `#password-section` shown, `#page-count` reads "Passwortgeschützt"
- [ ] Wrong password: `#password-error` shown
- [ ] `#convert-btn` shown after successful load
- [ ] `getCurrentFile()` returns the loaded `File` object
- [ ] `getPageRange()` returns `null` when range hidden, `{ start, end }` when shown

**Verify:** Manual — drag a PDF, verify file info; try a password-protected PDF, verify password prompt appears.

**Steps:**

- [ ] **Step 1: Create src/ui/upload.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/upload.js
git commit -m "feat: add upload UI with drag-drop, password support, page range"
```

---

### Task 9: Progress UI Module

**Goal:** Progress bar and status messages driven by pipeline's `onProgress` callbacks.

**Files:**
- Create: `src/ui/progress.js`

**Acceptance Criteria:**
- [ ] `showProgress()` shows `#progress-section`, hides `#output-section`, resets bar to 0%
- [ ] `updateProgress('loading', ...)` → bar 10%, text "PDF wird geladen…"
- [ ] `updateProgress('extracting', 3, 12)` → text "Text wird extrahiert… (Seite 3/12)"
- [ ] `updateProgress('ocr', 7, 12)` → text "OCR läuft… (Seite 7/12 — kann etwas dauern)"
- [ ] `updateProgress('generating', ...)` → bar 90%, text "Markdown wird generiert…"
- [ ] `showDone()` → bar 100%, text "Fertig! ✓"
- [ ] `hideProgress()` hides `#progress-section`

**Verify:** Manual — trigger conversion, watch progress bar fill and status messages update.

**Steps:**

- [ ] **Step 1: Create src/ui/progress.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/progress.js
git commit -m "feat: add progress UI with step-based status messages and bar"
```

---

### Task 10: Output UI + Main Wiring

**Goal:** Output section (preview, raw toggle, copy, downloads) + ko-fi banner + full app wiring.

**Files:**
- Create: `src/ui/output.js`
- Modify: `src/main.js`

**Acceptance Criteria:**
- [ ] `showOutput(markdown, sizeInfo)` renders via `marked`, shows `#output-section`
- [ ] Toggle switches between rendered preview and raw textarea
- [ ] Copy writes to clipboard, shows "Kopiert ✓" for 2 s then reverts to "Kopieren"
- [ ] Download `.md` always available
- [ ] `sizeInfo.status === 'red'` → ZIP, Split, Text-Only download buttons added
- [ ] Split download splits by `\n\n---\n\n` separator
- [ ] Ko-fi banner shown after `showOutput`
- [ ] `main.js`: convert button → pipeline → progress → output
- [ ] `main.js`: `OCR_UNAVAILABLE` error → "Tesseract konnte nicht geladen werden. Bitte Internetverbindung prüfen."
- [ ] `main.js`: other errors → `alert` with error message

**Verify:** Manual — convert a PDF, verify preview renders, copy works, downloads save files, ko-fi banner visible.

**Steps:**

- [ ] **Step 1: Create src/ui/output.js**

```js
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
```

- [ ] **Step 2: Rewrite src/main.js**

```js
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
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```
Open http://localhost:5173, load a real PDF, click Konvertieren:
- Progress bar fills with correct status text per step
- Output section appears with rendered Markdown preview
- Toggle switches to raw textarea and back
- Copy button works (paste into text editor to confirm)
- Download `.md` triggers file save
- Ko-fi banner visible at bottom of page

- [ ] **Step 4: Commit**

```bash
git add src/ui/output.js src/main.js
git commit -m "feat: add output UI with preview/raw/copy/download/kofi; wire main.js"
```

---

### Task 11: Production Build Verification

**Goal:** `npm run build` succeeds; built app handles a full conversion in preview mode.

**Files:**
- Modify: `vite.config.js` (only if build fails with PDF.js chunking errors)

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] `npm run build` exits 0, `dist/` created
- [ ] `npm run preview` → complete PDF conversion works at http://localhost:4173
- [ ] No console errors in built app

**Verify:** `npm run build && npm run preview` → manual full-conversion test.

**Steps:**

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```
Expected: all tests pass

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: exit 0, `dist/` with `index.html` + `assets/`

- [ ] **Step 3: If PDF.js worker chunking fails, update vite.config.js**

Only needed if Step 2 fails with PDF.js worker errors. Replace content of `vite.config.js`:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
          tesseract: ['tesseract.js'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
})
```

Run `npm run build` again.

- [ ] **Step 4: Preview and test**

```bash
npm run preview
```
Open http://localhost:4173. Convert a PDF with text + embedded images. Verify full flow.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js
git commit -m "feat: verify production build, configure Vite chunking for pdfjs-dist"
```

---

## Spec Coverage

| Spec Requirement | Task |
|---|---|
| Browser-only, no server | All modules — no backend calls |
| PDF.js text extraction | Task 3 |
| Tesseract OCR, lazy-loaded | Task 4 (worker created on demand) |
| Scanned page detection (< 50 chars) | Task 5 (`SCANNED_THRESHOLD = 50`) |
| Images: OCR + Base64 embed | Tasks 3, 5 |
| Drag & drop + file picker | Task 8 |
| Filename + page count display | Task 8 |
| Page range for > 100 pages | Task 8 |
| Green/yellow/red size indicator | Tasks 1, 8 |
| Progress bar with status messages | Task 9 |
| Heading detection by font size | Task 2 |
| Bullet / ordered list detection | Task 2 |
| Monospace → code block | Task 2 |
| Header/footer removal | Task 2 (`detectRepeated`) |
| Page breaks as `---` | Task 2 |
| Image embed with OCR comment | Task 2 |
| Rendered preview + raw toggle | Task 10 |
| Copy to clipboard | Task 10 |
| Download `.md` | Task 10 |
| Download ZIP | Task 10 (via `exporter.js`) |
| Split pages download | Task 10 (split by `---`) |
| Text-only download | Tasks 6, 10 (`stripImages`) |
| Ko-fi banner | Task 10 |
| Password-protected PDF | Tasks 3, 8 |
| Corrupt page placeholder | Task 5 |
| PDF > 100 pages warning + range | Task 8 |
| Tesseract load error message | Task 10 (`main.js OCR_UNAVAILABLE`) |
