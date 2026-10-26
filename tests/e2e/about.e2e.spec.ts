import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('About', () => {
  test('opens the author page from the header', async ({ page }) => {
    await page.goto('/uk')

    const about = page
      .getByRole('navigation', { name: uk.nav.primary })
      .getByRole('link', { name: uk.nav.about })

    await about.click()

    await expect(page).toHaveURL(/\/uk\/about$/)
    await expect(page.getByRole('navigation', { name: uk.nav.primary })).toBeVisible()
    await expect(about).toHaveAttribute('aria-current', 'page')
  })
})
