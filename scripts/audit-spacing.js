async (page) => {
  const report = []
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    for (const route of ['dashboard', 'library', 'flashcards', 'quizzes', 'notebooks', 'planner', 'subjects', 'tasks', 'focus', 'analytics', 'settings']) {
      await page.goto(`http://127.0.0.1:5173/${route}`)
      await page.getByRole('heading', { level: 1 }).first().waitFor()
      await page.waitForLoadState('networkidle')
      await page.locator('main .animate-pulse').first().waitFor({ state: 'hidden' })
      await page.screenshot({ path: `output/playwright/spacing-${width}-${route}.png`, fullPage: true, animations: 'disabled' })
      report.push({ route, width, ...(await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        overflowing: [...document.querySelectorAll('main *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(e).position !== 'absolute').slice(0, 8).map(e => ({tag:e.tagName, class:e.className})),
        navHeight: document.querySelector('nav[aria-label="Main"] a')?.getBoundingClientRect().height,
      }))) })
    }
  }
  return report
}
