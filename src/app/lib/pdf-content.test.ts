import { expect, it } from 'vitest'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { pdfText, relatedFigures } from './pdf-content'

const item = (str: string, x: number, y: number, size: number, width = 10): TextItem => ({ str, transform: [size, 0, 0, size, x, y], width, height: size, dir: 'ltr', fontName: 'test', hasEOL: false })
it('preserves raised charges and lowered atom counts without guessing from plain digits', () => {
  expect(pdfText([item('Mg', 0, 100, 12), item('2+', 10, 104, 8)])).toBe('Mg<sup>2+</sup>')
  expect(pdfText([item('H', 0, 100, 12), item('2', 10, 97, 8), item('O', 16, 100, 12)])).toBe('H<sub>2</sub> O')
  expect(pdfText([item('Mg2', 0, 100, 12)])).toBe('Mg2')
  expect(pdfText([item('First line', 0, 100, 12), item('Second line', 0, 80, 12)])).toContain('\nSecond line')
})
it('matches source figures only when captions support the topic', () => {
  const figure = { sourceId: 'source', page: 2, rect: [0, 0, .5, .5] as [number, number, number, number], caption: 'Reduction of copper oxide' }
  expect(relatedFigures([figure], 'Reduction')).toEqual([figure])
  expect(relatedFigures([figure], 'Corrosion')).toEqual([])
})
