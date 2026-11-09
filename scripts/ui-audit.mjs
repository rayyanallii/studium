// Signed-out and signed-in UI audit with Playwright.
//
//   AUDIT_EMAIL=... AUDIT_PASSWORD=... node scripts/ui-audit.mjs
//
// Creates one throwaway account through the real sign-up form, checks sign-out
// and sign-in, then walks the app at desktop and phone widths looking for
// horizontal overflow, clipped elements and undersized tap targets. Screenshots
// land in output/audit/. The throwaway account is removed at the end when
// AUDIT_SECRET and AUDIT_SUPABASE_URL are provided.
import { mkdirSync, writeFileSync } from 'node:fs'

import { chromium } from 'playwright'

const BASE = process.env.AUDIT_BASE ?? 'http://localhost:5173'
const EMAIL = process.env.AUDIT_EMAIL
const PASSWORD = process.env.AUDIT_PASSWORD
const SUPABASE_URL = process.env.AUDIT_SUPABASE_URL
const SECRET = process.env.AUDIT_SECRET
const OUT = 'output/audit'

mkdirSync(OUT, { recursive: true })

const findings = []
const consoleErrors = []
const stamp = Date.now()
const newEmail = `audit.${stamp}@gmail.com`

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await context.newPage()

page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(`console: ${message.text().slice(0, 240)}`)
})

async function inspect(name) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(350)
  const metrics = await page.evaluate(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const header = document.querySelector('header')?.getBoundingClientRect()
    const elements = [...document.querySelectorAll('body *')]
    const clipped = elements
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        if (rect.width === 0 || rect.height === 0) return false
        if (style.position === 'fixed' || style.position === 'sticky') return false
        if (element.closest('.overflow-x-auto, [data-scroll-x]')) return false
        return rect.right > width + 1 || rect.left < -1
      })
      .slice(0, 6)
      .map((element) => `${element.tagName.toLowerCase()}.${String(element.className).split(' ').slice(0, 3).join('.')}`)
    const smallTargets = [...document.querySelectorAll('button, [role="button"]')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return false
        return rect.height < 32 || rect.width < 32
      })
      .slice(0, 6)
      .map((element) => `${element.tagName.toLowerCase()}:${(element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 24)}`)
    const headerOpaque = header ? !/rgba\([^)]*0(\.\d+)?\)/.test(getComputedStyle(document.querySelector('header')).backgroundColor) : false
    const overlapsHeader = header && headerOpaque
      ? elements
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            if (rect.height === 0 || rect.top >= header.bottom - 1) return false
            if (element.closest('header')) return false
            if (getComputedStyle(element).position === 'fixed') return false
            return rect.top < header.bottom - 2 && rect.bottom > header.top + 2
          })
          .slice(0, 4)
          .map((element) => element.tagName.toLowerCase())
      : []
    return {
      path: location.pathname,
      viewport: `${width}x${height}`,
      horizontalOverflow: document.documentElement.scrollWidth - width,
      clipped,
      smallTargets,
      overlapsHeader,
    }
  })
  if (metrics.horizontalOverflow > 0 || metrics.clipped.length) {
    findings.push({ name, ...metrics })
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  return metrics
}

async function signIn(email, password) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
}

try {
  // ---------- signed out ----------
  for (const route of ['/', '/login', '/signup']) {
    await page.goto(BASE + route)
    await inspect(`desktop${route === '/' ? '-landing' : route.replace('/', '-')}`)
  }

  // ---------- sign up through the form ----------
  await page.goto(`${BASE}/signup`)
  await page.getByLabel('Your name').fill('Audit User')
  await page.getByLabel('Email address').fill(newEmail)
  await page.getByLabel('Password').fill(PASSWORD || 'Studium-audit-2026!')
  await page.getByRole('button', { name: /create account/i }).click()
  await page.waitForURL('**/onboarding', { timeout: 25_000 })
  await inspect('desktop-onboarding-after-signup')
  findings.push({ name: 'signup', result: `ok → ${new URL(page.url()).pathname}` })

  // ---------- sign in with the provided account ----------
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-')) localStorage.removeItem(key)
    }
  })
  await signIn(EMAIL, PASSWORD)
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 25_000 }).catch(async () => {
    await page.waitForTimeout(2500)
    findings.push({ name: 'signin', result: `unexpected url ${page.url()}` })
  })

  for (const route of ['dashboard', 'subjects', 'tasks', 'planner', 'library', 'flashcards', 'quizzes', 'notebooks', 'focus', 'analytics', 'settings']) {
    await page.goto(`${BASE}/${route}`)
    await page.waitForTimeout(700)
    await inspect(`desktop-${route}`)
  }

  // ---------- sign out / sign back in ----------
  await page.goto(`${BASE}/dashboard`)
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByText('Sign out', { exact: true }).click()
  await page.waitForURL((url) => url.pathname === '/login', { timeout: 20_000 })
  findings.push({ name: 'signout', result: 'ok → /login' })

  await signIn(EMAIL, PASSWORD)
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 25_000 })
  findings.push({ name: 'signin-after-signout', result: 'ok → /dashboard' })

  // ---------- phone layout ----------
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['/', '/login', '/signup']) {
    await page.goto(BASE + route)
    await inspect(`mobile${route === '/' ? '-landing' : route.replace('/', '-')}`)
  }
  await page.goto(`${BASE}/dashboard`)
  await page.waitForTimeout(500)
  for (const route of ['dashboard', 'tasks', 'subjects', 'planner', 'settings']) {
    await page.goto(`${BASE}/${route}`)
    await page.waitForTimeout(700)
    await inspect(`mobile-${route}`)
  }
} catch (error) {
  findings.push({ name: 'flow', result: `failed: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}` })
  await page.screenshot({ path: `${OUT}/failure.png` }).catch(() => {})
} finally {
  await browser.close()
}

// ---------- remove the throwaway account ----------
let cleanup = 'skipped'
if (SUPABASE_URL && SECRET) {
  const headers = { apikey: SECRET, authorization: `Bearer ${SECRET}` }
  const profiles = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&display_name=eq.Audit%20User`, { headers })
    .then((response) => response.json())
    .catch(() => [])
  for (const profile of profiles) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${profile.id}`, { method: 'DELETE', headers })
    cleanup = `${cleanup} ${profile.id}:${response.status}`
  }
}

const report = { newEmail, cleanup, findings, consoleErrors: [...new Set(consoleErrors)].slice(0, 20) }
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
