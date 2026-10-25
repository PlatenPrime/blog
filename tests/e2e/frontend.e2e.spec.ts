import { test, expect } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Frontend', () => {
  test('home loads', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/uk\/?$/)
    await expect(page).toHaveTitle(uk.nav.siteTitle)

    const heading = page.locator('h1').first()
    await expect(heading).toHaveText(uk.nav.siteTitle)
  })
})
