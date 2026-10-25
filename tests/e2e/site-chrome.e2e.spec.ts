import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Site chrome', () => {
  test('exposes landmarks, locale-prefixed sections, and guest auth', async ({ page }) => {
    await page.goto('/uk')

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('link', { name: uk.nav.skipToContent })).toHaveAttribute(
      'href',
      '#main',
    )
    await expect(page.locator('main#main')).toBeVisible()

    const primary = page.getByRole('navigation', { name: uk.nav.primary })
    await expect(primary.getByRole('link', { name: uk.nav.notes })).toHaveAttribute(
      'href',
      '/uk/notes',
    )

    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('navigation', { name: uk.nav.footer })).toBeVisible()
    await expect(footer.getByRole('link', { name: uk.nav.feed })).toHaveAttribute(
      'href',
      '/uk/feed',
    )

    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: uk.nav.login })).toBeVisible()
    await expect(header.getByRole('link', { name: uk.nav.register })).toBeVisible()
    await expect(header.getByRole('link', { name: uk.nav.logout })).toHaveCount(0)
  })

  test('keeps section links visible on a narrow viewport and marks the current one', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/uk/notes')

    const notes = page
      .getByRole('navigation', { name: uk.nav.primary })
      .getByRole('link', { name: uk.nav.notes })

    await expect(notes).toBeVisible()
    await expect(notes).toHaveAttribute('aria-current', 'page')
    await expect(
      page
        .getByRole('navigation', { name: uk.nav.primary })
        .getByRole('link', { name: uk.nav.articles }),
    ).not.toHaveAttribute('aria-current', 'page')
  })
})
