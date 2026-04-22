# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the PDF→Markdown UI with a CSS custom-property token system, automatic dark mode, a collapsible options toggle for page range, and a legal footer.

**Architecture:** CSS-only dark mode via `prefers-color-scheme`; all hardcoded colors replaced with CSS custom properties in `style.css`. HTML gets three structural changes (subtitle, options toggle, footer). JS in `upload.js` replaces the >100-page auto-show logic with a user-driven toggle.

**Tech Stack:** Vanilla HTML/CSS/JS, Vite dev server (`npm run dev`), Vitest (`npm test`)

---

### Task 0: CSS Token System, Dark Mode & Visual Refresh

**Goal:** Replace all hardcoded colors in `style.css` with CSS custom properties and add automatic dark mode.

**Files:**
- Modify: `src/style.css`

**Acceptance Criteria:**
- [ ] `:root` block defines 9 tokens (see Steps)
- [ ] `@media (prefers-color-scheme: dark)` overrides all 9 tokens
- [ ] No hardcoded color values remain in `style.css` (except Ko-fi orange — intentionally kept)
- [ ] Drop-zone hover uses `box-shadow` in addition to border-color change
- [ ] `header h1` has `letter-spacing: -0.02em`
- [ ] Progress bar height is `8px` (was `10px`)
- [ ] All `border-radius` on interactive elements is `8px`
- [ ] App looks correct in both light and dark system mode

**Verify:** `npm run dev` → open browser → toggle system dark/light mode → verify no hardcoded colors remain visible as artifacts

**Steps:**

- [ ] **Step 1: Replace the entire `style.css` with the following content**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:            #f9fafb;
  --surface:       #ffffff;
  --surface-2:     #f3f4f6;
  --border:        #e5e7eb;
  --text:          #111827;
  --muted:         #6b7280;
  --accent:        #6366f1;
  --accent-hv:     #4f46e5;
  --accent-subtle: #eef2ff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:            #0f1117;
    --surface:       #1a1d27;
    --surface-2:     #252836;
    --border:        #2d3148;
    --text:          #f3f4f6;
    --muted:         #9ca3af;
    --accent:        #818cf8;
    --accent-hv:     #6366f1;
    --accent-subtle: #1e1b4b;
  }
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  padding: 1rem;
}

#app { max-width: 860px; margin: 0 auto; }

header { text-align: center; padding: 2rem 0 1.5rem; }
header h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; }
header p { color: var(--muted); margin-top: 0.25rem; font-size: 0.95rem; }

/* ── Upload ── */

#drop-zone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  background: var(--surface);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
#drop-zone.dragover {
  border-color: var(--accent);
  background: var(--accent-subtle);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent);
}
#drop-zone p { color: var(--muted); margin-bottom: 0.5rem; }
#drop-zone label { color: var(--accent); cursor: pointer; text-decoration: underline; font-weight: 500; }
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
#page-count { color: var(--muted); }

.indicator {
  padding: 0.2rem 0.7rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 700;
}
.indicator.green { background: #d1fae5; color: #065f46; }
.indicator.yellow { background: #fef3c7; color: #92400e; }
.indicator.red { background: #fee2e2; color: #991b1b; }

#options-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.82rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
#options-toggle:hover { background: var(--accent-subtle); }

#options-panel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  flex-wrap: wrap;
  color: var(--text);
}
#options-panel label { color: var(--muted); }
#options-panel input[type="number"] {
  width: 80px;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--surface);
  color: var(--text);
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
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--surface);
  color: var(--text);
}
#unlock-btn {
  padding: 0.3rem 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text);
}
#unlock-btn:hover { background: var(--border); }

#convert-btn {
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.75rem 3rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
#convert-btn:hover { background: var(--accent-hv); }

/* ── Progress ── */

#progress-section { margin-top: 2rem; }

#progress-bar-container {
  background: var(--surface-2);
  border-radius: 99px;
  height: 8px;
  overflow: hidden;
}
#progress-bar {
  height: 100%;
  width: 0%;
  background: var(--accent);
  border-radius: 99px;
  transition: width 0.35s ease;
}
#progress-status { margin-top: 0.6rem; color: var(--muted); font-size: 0.9rem; }

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
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s;
}
#output-controls button:hover { background: var(--surface-2); }

#download-options { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-left: auto; }
#download-options button { background: #f0fdf4; border-color: #86efac; color: #166534; }
#download-options button:hover { background: #dcfce7; }

#output-preview {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem 2rem;
  background: var(--surface);
  max-height: 65vh;
  overflow-y: auto;
  font-size: 0.95rem;
}
#output-preview h1 { font-size: 1.6rem; margin: 1.25rem 0 0.5rem; }
#output-preview h2 { font-size: 1.3rem; margin: 1rem 0 0.4rem; }
#output-preview h3 { font-size: 1.1rem; margin: 0.75rem 0 0.3rem; }
#output-preview p { margin-bottom: 0.75rem; }
#output-preview ul, #output-preview ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
#output-preview pre { background: var(--surface-2); padding: 0.75rem 1rem; border-radius: 6px; overflow-x: auto; }
#output-preview table { border-collapse: collapse; width: 100%; margin-bottom: 0.75rem; }
#output-preview th, #output-preview td { border: 1px solid var(--border); padding: 0.35rem 0.7rem; text-align: left; }
#output-preview th { background: var(--surface-2); font-weight: 600; }
#output-preview img { max-width: 100%; border-radius: 4px; margin: 0.5rem 0; }
#output-preview hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }

#output-raw {
  width: 100%;
  height: 65vh;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 0.825rem;
  line-height: 1.5;
  resize: vertical;
  background: var(--surface-2);
  color: var(--text);
}

/* ── Ko-fi ── */

#kofi-banner {
  margin-top: 2rem;
  padding: 0.875rem 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: var(--text);
}
#kofi-banner a { color: #ea580c; font-weight: 600; text-decoration: none; }
#kofi-banner a:hover { text-decoration: underline; }

/* ── Footer ── */

footer {
  margin-top: 2.5rem;
  padding: 1rem 0 2rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted);
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}
footer a { color: var(--accent); text-decoration: none; }
footer a:hover { text-decoration: underline; }

/* ── Responsive ── */

@media (max-width: 600px) {
  #output-controls { flex-direction: column; align-items: flex-start; }
  #download-options { margin-left: 0; }
  #convert-btn { width: 100%; }
}
```

- [ ] **Step 2: Start dev server and verify visually**

```bash
npm run dev
```

Open browser. Check:
- Light mode: white surface, indigo accents, gray muted text
- Dark mode (toggle system preference): dark background (`#0f1117`), lighter surface, purple accents
- Drop zone hover: indigo border + subtle indigo background + glow
- Ko-fi banner uses surface/border tokens (no longer orange background)

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: CSS token system with automatic dark mode"
```

---

### Task 1: HTML Structure Updates

**Goal:** Update `index.html` to remove the Claude tagline, add the options toggle markup, and add a legal footer.

**Files:**
- Modify: `index.html`

**Acceptance Criteria:**
- [ ] Subtitle reads "Browser-basiert · Datenschutzfreundlich" (no Claude mention)
- [ ] `#page-range` div is replaced by `#options-toggle` button + `#options-panel` div
- [ ] `#options-panel` contains `range-start` and `range-end` inputs (same IDs as before)
- [ ] `<footer>` exists at end of `#app` with Impressum and Datenschutz links

**Verify:** `npm run dev` → page loads without JS errors, footer links visible

**Steps:**

- [ ] **Step 1: Update subtitle (line 13)**

Change:
```html
<p>Browser-basiert · Datenschutzfreundlich · Für Claude optimiert</p>
```
To:
```html
<p>Browser-basiert · Datenschutzfreundlich</p>
```

- [ ] **Step 2: Replace `#page-range` with options toggle**

Remove this block (lines 27–34):
```html
<div id="page-range" hidden>
  <span>Seitenbereich (PDF hat über 100 Seiten):</span>
  <label for="range-start">Von</label>
  <input type="number" id="range-start" min="1" placeholder="Von" />
  <span>–</span>
  <label for="range-end">Bis</label>
  <input type="number" id="range-end" min="1" placeholder="Bis" />
</div>
```

Insert after `#file-info` closing `</div>` (before `#password-section`):
```html
<button id="options-toggle" type="button" hidden>⚙ Optionen ▼</button>
<div id="options-panel" hidden>
  <label for="range-start">Seiten von</label>
  <input type="number" id="range-start" min="1" placeholder="1" />
  <span>–</span>
  <label for="range-end">bis</label>
  <input type="number" id="range-end" min="1" />
</div>
```

- [ ] **Step 3: Add footer before closing `</div>` of `#app` (after `#kofi-banner`)**

```html
<footer>
  <a href="https://fieber-it.com/impressum" target="_blank" rel="noopener">Impressum</a>
  <a href="https://fieber-it.com/datenschutz" target="_blank" rel="noopener">Datenschutz</a>
</footer>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Check: subtitle correct, footer links present and styled. Expect JS console errors about missing `#page-range` — fixed in Task 2.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: update HTML — remove Claude tagline, add options toggle, add footer"
```

---

### Task 2: JS Options Toggle Wiring

**Goal:** Update `upload.js` to wire the options toggle button and remove the old >100-page auto-show logic.

**Files:**
- Modify: `src/ui/upload.js`

**Acceptance Criteria:**
- [ ] `#page-range` DOM reference removed; replaced with `#options-toggle` and `#options-panel`
- [ ] Options toggle button shown after file successfully loads (normal + after password unlock)
- [ ] Clicking toggle shows/hides `#options-panel` and updates button text (▼/▲)
- [ ] `getPageRange()` returns `null` when `#options-panel` is hidden, otherwise returns `{start, end}`
- [ ] Old `numPages > 100` auto-show logic removed
- [ ] All existing tests pass: `npm test`

**Verify:** `npm test` → all tests pass; `npm run dev` → upload PDF, click Optionen, enter range, convert works

**Steps:**

- [ ] **Step 1: Replace `src/ui/upload.js` with the following**

```js
import { loadPDF } from '../pdf-extractor.js'
import { analyzeSize } from '../size-analyzer.js'

const dropZone = document.getElementById('drop-zone')
const fileInput = document.getElementById('file-input')
const fileInfo = document.getElementById('file-info')
const fileNameEl = document.getElementById('file-name')
const pageCountEl = document.getElementById('page-count')
const sizeIndicator = document.getElementById('size-indicator')
const optionsToggle = document.getElementById('options-toggle')
const optionsPanel = document.getElementById('options-panel')
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
  if (optionsPanel.hidden) return null
  return {
    start: parseInt(rangeStart.value) || 1,
    end: parseInt(rangeEnd.value) || 1,
  }
}

optionsToggle.addEventListener('click', () => {
  const open = !optionsPanel.hidden
  optionsPanel.hidden = open
  optionsToggle.textContent = open ? '⚙ Optionen ▼' : '⚙ Optionen ▲'
})

async function handleFile(file) {
  if (!file || !file.name.toLowerCase().endsWith('.pdf')) return
  currentFile = file

  const sizeInfo = analyzeSize(file.size)
  fileNameEl.textContent = file.name
  sizeIndicator.textContent = `${sizeInfo.mb} MB`
  sizeIndicator.className = `indicator ${sizeInfo.status}`
  if (sizeInfo.warning) sizeIndicator.title = sizeInfo.warning

  fileInfo.hidden = false
  optionsToggle.hidden = true
  optionsPanel.hidden = true
  optionsToggle.textContent = '⚙ Optionen ▼'
  passwordSection.hidden = true
  passwordError.hidden = true
  convertBtn.hidden = true
  pageCountEl.textContent = 'Lädt…'

  try {
    const { numPages } = await loadPDF(file)
    pageCountEl.textContent = `${numPages} Seiten`
    rangeEnd.max = numPages
    rangeStart.value = 1
    rangeEnd.value = numPages
    optionsToggle.hidden = false
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
    rangeEnd.max = numPages
    rangeStart.value = 1
    rangeEnd.value = numPages
    passwordSection.hidden = true
    optionsToggle.hidden = false
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

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all existing tests pass. `upload.js` has no direct unit tests (it's a DOM module) — look for zero failures across the suite.

- [ ] **Step 3: Manual browser test**

```bash
npm run dev
```

Test flow:
1. Drop a PDF → file info appears, "⚙ Optionen ▼" button appears
2. Click Optionen → panel expands showing Von/Bis inputs, button shows ▲
3. Click again → panel collapses, button shows ▼
4. Click Konvertieren → conversion runs with full page range (panel hidden → `getPageRange()` returns `null`)
5. Open Optionen, set range → convert → only selected pages converted

- [ ] **Step 4: Commit**

```bash
git add src/ui/upload.js
git commit -m "feat: options toggle replaces auto-shown page range"
```
