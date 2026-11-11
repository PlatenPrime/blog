import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Privacy', () => {
  test('opens the privacy page from the footer', async ({ page }) => {
    await page.goto('/uk')

    const privacy = page.getByRole('contentinfo').getByRole('link', { name: uk.nav.privacy })

    await privacy.click()

    await expect(page).toHaveURL(/\/uk\/privacy$/)
    await expect(page.getByRole('navigation', { name: uk.nav.primary })).toBeVisible()
  })
})
