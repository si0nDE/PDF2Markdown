# Frontend Redesign — Design Spec
**Date:** 2026-04-22  
**Project:** Markdown2PDF  
**Approach:** CSS Variables Refresh (Ansatz 1)

---

## Ziele

- Modernes, professionelles Design (Clean SaaS, Indigo-Akzent)
- Automatischer Dark Mode via `prefers-color-scheme`
- "Für Claude optimiert" aus Subtitle entfernen
- Seitenbereich hinter Optionen-Toggle verstecken
- Passwort-Eingabe nur bei erkanntem Passwortschutz (bereits vorhanden)
- Footer mit Impressum- und Datenschutz-Links

---

## Ansatz

**CSS-Variables-Refresh:** Alle Farbwerte in `style.css` durch CSS Custom Properties ersetzen. Ein `@media (prefers-color-scheme: dark)` Block überschreibt die Tokens. Keine neue Dependency, minimaler Diff, kein Risiko für bestehende JS-Logik.

---

## Token-System (`style.css`)

```css
:root {
  --bg:        #f9fafb;
  --surface:   #ffffff;
  --border:    #e5e7eb;
  --text:      #111827;
  --muted:     #6b7280;
  --accent:    #6366f1;
  --accent-hv: #4f46e5;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:        #0f1117;
    --surface:   #1a1d27;
    --border:    #2d3148;
    --text:      #f3f4f6;
    --muted:     #9ca3af;
    --accent:    #818cf8;
    --accent-hv: #6366f1;
  }
}
```

Alle hardcodierten Farben in `style.css` (Hintergründe, Borders, Text, Akzent) werden durch `var(--...)` ersetzt.

---

## HTML-Änderungen (`index.html`)

### 1. Subtitle
```html
<!-- vorher -->
<p>Browser-basiert · Datenschutzfreundlich · Für Claude optimiert</p>

<!-- nachher -->
<p>Browser-basiert · Datenschutzfreundlich</p>
```

### 2. Optionen-Toggle (ersetzt #page-range)
```html
<button id="options-toggle" type="button">⚙ Optionen ▼</button>
<div id="options-panel" hidden>
  <label for="range-start">Von</label>
  <input type="number" id="range-start" min="1" />
  <span>–</span>
  <label for="range-end">Bis</label>
  <input type="number" id="range-end" min="1" />
</div>
```

Der alte `#page-range` div (der nur bei >100 Seiten erschien) wird durch dieses Markup ersetzt. Der Optionen-Toggle ist immer sichtbar sobald eine Datei geladen ist.

### 3. Passwort-Sektion
Kein HTML-Change. `#password-section` bleibt `hidden` by default. JS-Logik zeigt die Sektion nur wenn das PDF passwortgeschützt ist — Verhalten unverändert.

### 4. Footer (neu, am Ende von `#app`)
```html
<footer>
  <a href="https://fieber-it.com/impressum" target="_blank" rel="noopener">Impressum</a>
  <a href="https://fieber-it.com/datenschutz" target="_blank" rel="noopener">Datenschutz</a>
</footer>
```

---

## JS-Änderungen

### Optionen-Toggle (`upload.js` oder `main.js`)
```js
document.getElementById('options-toggle').addEventListener('click', () => {
  const panel = document.getElementById('options-panel');
  const open = !panel.hidden;
  panel.hidden = open;
  document.getElementById('options-toggle').textContent = open
    ? '⚙ Optionen ▼'
    : '⚙ Optionen ▲';
});
```

Bestehende Logik in `upload.js` die `#page-range` per `hidden` steuert (Threshold >100 Seiten) wird entfernt. Seitenbereich-Werte (`range-start`, `range-end`) werden weiterhin ausgelesen — nur die Sichtbarkeitslogik ändert sich.

---

## Visuelle CSS-Verbesserungen

Alle via `var(--...)` — keine hardcodierten Farben. Modernisierungen:

| Element | Änderung |
|---|---|
| Drop-Zone | `border-radius: 12px`, Hover via `box-shadow` statt nur `border-color` |
| Buttons | `border-radius: 8px` durchgehend, `font-weight: 600` |
| Header h1 | `letter-spacing: -0.02em` |
| Size-Badges | Farben via Tokens (bleiben Pills) |
| Progress-Bar | `height: 8px` (war 10px) |
| Output-Controls | `background: var(--surface)`, `border: 1px solid var(--border)` |
| Ko-fi-Banner | `background: var(--surface)`, `border-color: var(--border)`, Orange-Akzent bleibt |
| Footer | `text-align: center`, `font-size: 0.8rem`, `color: var(--muted)`, Links in `var(--accent)` |

Kein Layout-Change, keine neuen Klassen — nur Werte modernisiert.

---

## Dateien betroffen

| Datei | Art der Änderung |
|---|---|
| `index.html` | Subtitle, Optionen-Toggle, Footer |
| `src/style.css` | Token-System, alle Farbwerte ersetzen, visuelle Verbesserungen |
| `src/ui/upload.js` | Optionen-Toggle-Logik, alte page-range-Logik entfernen |

---

## Nicht in Scope

- Kein Layout-Umbau
- Kein Tailwind / neue Build-Dependencies
- Kein manueller Dark-Mode-Toggle (nur systemgesteuert)
- Keine Änderung an Pipeline, OCR, Exporter
