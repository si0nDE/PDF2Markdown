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
  expect(result.bytes).toBe(1 * MB)
  expect(result.mb).toBeDefined()
  expect(result.warning).toMatch(/token-intensiv/)
  expect(result.recommendations).toBeUndefined()
})

test('red with 3 recommendations for files over 2MB', () => {
  const result = analyzeSize(3 * MB)
  expect(result.status).toBe('red')
  expect(result.bytes).toBe(3 * MB)
  expect(result.mb).toBeDefined()
  expect(result.warning).toMatch(/Alternative/)
  expect(result.recommendations).toHaveLength(3)
  expect(result.recommendations.map(r => r.id)).toEqual(['zip', 'split', 'text-only'])
})

test('exactly at green/yellow boundary (500KB) → yellow', () => {
  const result = analyzeSize(500 * KB)
  expect(result.status).toBe('yellow')
})

test('exactly at yellow/red boundary (2MB) → red', () => {
  const result = analyzeSize(2 * MB)
  expect(result.status).toBe('red')
})
