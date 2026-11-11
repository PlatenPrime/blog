import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Cookie consent', () => {
  test('shows the banner, declines, and keeps the choice after reload', async ({ page }) => {
    await page.goto('/uk')

    const dialog = page.getByRole('dialog', { name: uk.cookies.title })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('link', { name: uk.nav.privacy })).toHaveAttribute(
      'href',
      '/uk/privacy',
    )

    await dialog.getByRole('button', { name: uk.cookies.decline }).click()

    await expect(dialog).toHaveCount(0)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('cookie-consent')))
      .toBe('declined')

    await page.reload()

    await expect(page.getByRole('dialog', { name: uk.cookies.title })).toHaveCount(0)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('cookie-consent')))
      .toBe('declined')
  })

  test('accept stores analytics consent', async ({ page }) => {
    await page.goto('/uk')

    const dialog = page.getByRole('dialog', { name: uk.cookies.title })
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: uk.cookies.accept }).click()

    await expect(dialog).toHaveCount(0)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('cookie-consent')))
      .toBe('accepted')
  })
})
