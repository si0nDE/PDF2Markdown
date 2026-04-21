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

test('slightly-large font → H3', () => {
  const pages = [{
    pageNum: 1,
    items: [item('Subsection', 15), item('normal', 12), item('normal', 12)],
    images: [],
  }]
  expect(generateMarkdown(pages)).toMatch(/^### Subsection/m)
})

test('dash/star/em-dash bullets → markdown list', () => {
  const pages = [{
    pageNum: 1,
    items: [item('- Dash'), item('* Star'), item('– Em-dash')],
    images: [],
  }]
  const result = generateMarkdown(pages)
  expect(result).toContain('- Dash')
  expect(result).toContain('- Star')
  expect(result).toContain('- Em-dash')
})

test('ordered list with ) delimiter preserved', () => {
  const pages = [{
    pageNum: 1,
    items: [item('1) First'), item('2) Second')],
    images: [],
  }]
  const result = generateMarkdown(pages)
  expect(result).toContain('1) First')
  expect(result).toContain('2) Second')
})
