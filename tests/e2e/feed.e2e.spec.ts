import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Feed', () => {
  test('renders the mixed feed instead of the not-found page', async ({ page }) => {
    await page.goto('/uk/feed')

    await expect(page).toHaveTitle(`${uk.feed.title} — ${uk.nav.siteTitle}`)
    await expect(page.getByRole('heading', { level: 1, name: uk.feed.title })).toBeVisible()
    await expect(page.getByRole('heading', { name: uk.errors.notFoundTitle })).toHaveCount(0)

    const feed = page
      .getByRole('navigation', { name: uk.nav.primary })
      .getByRole('link', { name: uk.nav.feed })

    await expect(feed).toHaveAttribute('aria-current', 'page')
  })

  test('drops a non-positive page query', async ({ page }) => {
    await page.goto('/uk/feed?page=0')

    await expect(page).toHaveURL(/\/uk\/feed$/)
    await expect(page.getByRole('heading', { level: 1, name: uk.feed.title })).toBeVisible()
  })
})
