async (page) => {
  const fixture = __STUDY_FIXTURE__
  const results = []
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    for (const kind of ['flashcards', 'quiz', 'notebook']) {
      const item = fixture.data[kind]
      const route = `**/api/study/artifacts/${item.id}`
      await page.route(route, handler => handler.fulfill({ json: { data: item } }))
      await page.goto(`http://127.0.0.1:5173/study/${item.id}`)
      await page.getByRole('heading', { level: 1 }).waitFor()
      if (kind === 'flashcards') await page.getByRole('button', { name: 'Reveal answer', exact: true }).click()
      await page.screenshot({ path: `output/playwright/spacing-${width}-study-${kind}.png`, fullPage: true, animations: 'disabled' })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      if (overflow) throw new Error(`${kind} overflows at ${width}`)
      results.push({ kind, width, overflow })
      await page.unroute(route)
    }
  }
  return results
}
