import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { StudyMath } from './StudyMath'

it('renders chemistry, fractions and explicit source scripts as accessible math', () => {
  const html = renderToStaticMarkup(createElement(StudyMath, { text: String.raw`\(\ce{Mg^{2+}}\) \[\frac{1}{2}mv^2\] H<sub>2</sub>O` }))
  expect(html).toContain('<math')
  expect(html).toContain('<msup>')
  expect(html).toContain('<mfrac>')
  expect(html).toContain('<sub>2</sub>')
  expect(html).not.toContain('katex-error')
})
it('does not accept source HTML or trusted TeX links', () => {
  const html = renderToStaticMarkup(createElement(StudyMath, { text: String.raw`<img src=x onerror=alert(1)> \(\href{javascript:alert(1)}{click}\)` }))
  expect(html).not.toContain('<img')
  expect(html).not.toContain('<a ')
  expect(html).toContain('&lt;img')
})
