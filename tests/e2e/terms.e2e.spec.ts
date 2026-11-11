import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Terms', () => {
  test('opens the terms page from the footer', async ({ page }) => {
    await page.goto('/uk')

    const terms = page.getByRole('contentinfo').getByRole('link', { name: uk.nav.terms })

    await terms.click()

    await expect(page).toHaveURL(/\/uk\/terms$/)
    await expect(page.getByRole('navigation', { name: uk.nav.primary })).toBeVisible()
  })
})
