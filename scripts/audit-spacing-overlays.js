async (page) => {
  const results = []
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 360, height: 800 }]) {
    await page.setViewportSize(viewport)
    const visit = async route => { await page.goto(`http://127.0.0.1:5173/${route}`); await page.waitForLoadState('networkidle'); await page.locator('main .animate-pulse').first().waitFor({ state: 'hidden' }) }
    const capture = async label => {
      const dialog = page.getByRole('dialog')
      if (await dialog.count()) {
        const bounds = await dialog.boundingBox()
        if (!bounds || bounds.y < 0 || bounds.y + bounds.height > viewport.height + 1) throw new Error(`${label} escapes viewport vertically`)
      }
      await page.screenshot({ path: `output/playwright/spacing-${viewport.width}-${label}.png`, fullPage: false, animations: 'disabled' })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      if (overflow) throw new Error(`${label} overflows at ${viewport.width}`)
    }
    await visit('dashboard')
    if (viewport.width >= 1024) {
      const heights = await page.locator('nav[aria-label="Main"] a').evaluateAll(links => links.map(link => link.getBoundingClientRect().height))
      if (heights.some(height => height < 48)) throw new Error('Sidebar links compressed')
    }
    await page.getByRole('button', { name: 'Account', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Settings', exact: true }).waitFor()
    await capture('account-menu')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Search workspace', exact: true }).click()
    await page.getByRole('dialog').waitFor()
    await capture('search-dialog')
    await page.keyboard.press('Escape')
    for (const [route, action, label] of [['tasks', 'New task', 'task-dialog'], ['subjects', 'New subject', 'subject-dialog'], ['planner', 'Session', 'session-dialog'], ['planner', 'Generate plan', 'plan-dialog'], ['library', 'Add material', 'upload-dialog']]) {
      await visit(route)
      await page.getByRole('button', { name: action, exact: true }).first().click()
      await page.getByRole('dialog').waitFor()
      await capture(label)
      await page.keyboard.press('Escape')
    }
    await visit('subjects')
    const subject = page.locator('main a[href^="/subjects/"]').first()
    if (await subject.count()) { await subject.click(); await page.getByRole('heading', { level: 1 }).waitFor(); await page.locator('main .animate-pulse').first().waitFor({ state: 'hidden' }); await capture('subject-detail') }
    results.push({ ...viewport, result: 'No page overflow; inspected menus, search and five form dialogs' })
  }
  return results
}
