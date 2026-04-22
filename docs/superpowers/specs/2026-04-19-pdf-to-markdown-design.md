# PDF to Markdown Converter — Design Spec

**Datum:** 2026-04-19
**Status:** Approved

---

## Übersicht

Browser-basierte Single-Page-App, die PDFs in Claude-optimiertes, menschenlesbares Markdown konvertiert. Alle Verarbeitung findet im Browser des Nutzers statt — kein Server, keine Datenweitergabe (DSGVO-konform by design).

---

## Ziele

- PDFs vollständig im Browser zu Markdown konvertieren (kein Backend)
- Output für Claude optimiert und gleichzeitig für Menschen lesbar
- Digitale und gescannte PDFs unterstützen (Texterkennung via OCR)
- Bilder: OCR-Text extrahieren + visuelle Inhalte als Base64 einbetten
- Nutzer bei langer Verarbeitung durch Fortschrittsanzeige informieren
- Bei großen Dateien Alternativen mit Empfehlung anbieten

---

## Tech Stack

| Komponente | Technologie |
|---|---|
| Build-Tool | Vite |
| Sprache | Vanilla JavaScript (kein Framework) |
| PDF-Parsing | pdfjs-dist (PDF.js, Mozilla) |
| OCR | Tesseract.js (WebAssembly) |
| Deployment | Statische Dateien (netcup Webhosting) |

---

## Architektur

Drei Kernmodule mit klar getrennten Verantwortlichkeiten:

### `pdf-extractor`
PDF.js-Wrapper. Lädt die PDF-Datei, iteriert seitenweise, extrahiert:
- Textinhalt mit Positionsdaten (Schriftgröße, Koordinaten)
- Eingebettete Bilder als Canvas-Daten

### `ocr-engine`
Tesseract.js-Wrapper. Wird lazy geladen — das ~10 MB WASM-Binary wird erst heruntergeladen, wenn eine gescannte Seite oder ein Bild erkannt wird. Verarbeitet:
- Seiten ohne/mit wenig extrahiertem Text (gescannte PDFs)
- Eingebettete Bilder (zur Texterkennung)

### `markdown-generator`
Postprocessor. Wandelt rohe Extraktionsdaten in sauberes Markdown um. Erkennungsregeln:

| Element | Erkennungskriterium | Markdown-Output |
|---|---|---|
| Überschriften | Schriftgröße > Durchschnitt, kurze Zeile | `#` / `##` / `###` |
| Listen | Bullet-Zeichen oder Nummerierung am Zeilenanfang | `- ` / `1. ` |
| Tabellen | Gleichmäßige Spaltenabstände über mehrere Zeilen | Markdown-Tabelle |
| Codeblöcke | Monospace-Font in PDF-Metadaten | ` ``` ` |
| Kopf-/Fußzeilen | Identischer Text auf jeder Seite | Entfernt (Rauschreduktion) |
| Seitenumbrüche | Seitenende | `---` |

**Bild-Output:**
```markdown
<!-- Bild 3: [OCR-Text falls vorhanden] -->
![Abbildung 3](data:image/png;base64,...)
```

---

## UI & Konvertierungs-Flow

### 1. Upload
- Drag & Drop Zone + Datei-Picker
- Zeigt nach dem Laden: Dateiname, Seitenzahl
- Option: Seitenbereich eingrenzen (z.B. "Seiten 1–20") bei PDFs > 100 Seiten

### 2. Konvertierungs-Pipeline (pro Seite, sequenziell)
1. PDF.js extrahiert Text der Seite
2. Ausreichend Text vorhanden (≥ 50 Zeichen pro Seite) → direkt zum Markdown-Generator
3. Wenig/kein Text (< 50 Zeichen) → Seite als Canvas rendern → Tesseract OCR → Markdown-Generator
4. Eingebettete Bilder: Tesseract OCR → hat Bild Text? → als Kommentar + Base64 einbetten

### 3. Fortschrittsanzeige
Stufenweise Statusmeldungen mit Fortschrittsbalken:
- `PDF wird geladen… (Seite 3/12)`
- `Text wird extrahiert… (Seite 5/12)`
- `OCR läuft… (Seite 7/12 — kann etwas dauern)`
- `Markdown wird generiert…`
- `Fertig! ✓`

### 4. Größen-Indikator (Echtzeit)

| Dateigröße | Status | Aktion |
|---|---|---|
| < 500 KB | Grün | Keine |
| 500 KB – 2 MB | Gelb | Warnung: wird token-intensiv |
| > 2 MB | Rot | Alternative mit Empfehlung anbieten |

**Alternativen bei > 2 MB (mit Empfehlung):**
- **ZIP-Export** *(empfohlen bei bilderlastigen PDFs)*: Markdown-Datei + Bilder als separate Dateien
- **Aufteilen**: Kapitel/Seiten als einzelne Markdown-Dateien
- **Nur OCR-Text**: Bilder werden nicht eingebettet, nur extrahierter Text

### 5. Output-Bereich
- Markdown-Vorschau (gerendert + raw toggle)
- Copy-to-Clipboard Button
- Download-Optionen (abhängig von gewählter Alternative)

### 6. Ko-fi-Banner
Nach erfolgreicher Konvertierung: dezentes Banner unterhalb des Outputs.
> *"Hat dir das Tool geholfen? Unterstütze die Entwicklung ☕"* + Ko-fi-Link

---

## Fehlerbehandlung

| Fehlerfall | Behandlung |
|---|---|
| Passwortgeschützte PDF | Passwort-Eingabefeld, Fehlermeldung bei falschem Passwort |
| Korrupte Seite | Seite überspringen, Platzhalter `[Seite X konnte nicht verarbeitet werden]` |
| PDF > 100 Seiten | Warnung + Option Seitenbereich einzugrenzen |
| Tesseract lädt nicht | Fehlermeldung mit Hinweis auf Internetverbindung |

---

## Nicht im Scope

- Server-seitige Verarbeitung jeglicher Art
- Benutzerkonten oder Speicherung von Dateien
- Batch-Verarbeitung mehrerer PDFs gleichzeitig
- Rückkonvertierung Markdown → PDF
