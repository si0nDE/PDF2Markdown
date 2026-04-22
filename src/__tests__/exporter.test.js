import { vi, test, expect, beforeEach } from 'vitest'

const mockClick = vi.fn()
const mockAnchor = { href: '', download: '', click: mockClick }

vi.spyOn(document, 'createElement').mockImplementation((tag) => {
  if (tag === 'a') return mockAnchor
  return {}
})
URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
URL.revokeObjectURL = vi.fn()

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
