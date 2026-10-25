import { expect, test, type Page } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

function rootHasClass(page: Page, className: string) {
  return page.evaluate((name) => document.documentElement.classList.contains(name), className)
}

test.describe('Theme follows a dark system, then keeps an explicit choice', () => {
  test.use({ colorScheme: 'dark' })

  test('stores the toggle and restores it after reload', async ({ page }) => {
    await page.goto('/uk/dev/design')

    await expect.poll(() => rootHasClass(page, 'dark')).toBe(true)
    await expect.poll(() => rootHasClass(page, 'light')).toBe(false)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBeNull()

    const fontClasses = await page.evaluate(() =>
      [...document.documentElement.classList].filter((name) => name !== 'dark' && name !== 'light'),
    )
    expect(fontClasses.length).toBeGreaterThan(0)

    await page.getByRole('button', { name: uk.nav.themeToLight }).click()

    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await expect.poll(() => rootHasClass(page, 'dark')).toBe(false)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('light')

    await page.reload()

    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('light')
    await expect(page.getByRole('button', { name: uk.nav.themeToDark })).toBeVisible()
  })
})

test.describe('Theme follows a light system until the reader chooses', () => {
  test.use({ colorScheme: 'light' })

  test('starts light with no stored preference', async ({ page }) => {
    await page.goto('/uk')

    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await expect.poll(() => rootHasClass(page, 'dark')).toBe(false)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBeNull()
    await expect(page.getByRole('button', { name: uk.nav.themeToDark })).toBeVisible()
  })
})
