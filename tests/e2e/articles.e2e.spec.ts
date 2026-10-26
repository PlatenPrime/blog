import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Articles', () => {
  test('renders the article list instead of the not-found page', async ({ page }) => {
    await page.goto('/uk/articles')

    await expect(page).toHaveTitle(`${uk.articles.title} — ${uk.nav.siteTitle}`)
    await expect(page.getByRole('heading', { level: 1, name: uk.articles.title })).toBeVisible()
    await expect(page.getByRole('heading', { name: uk.errors.notFoundTitle })).toHaveCount(0)

    const articles = page
      .getByRole('navigation', { name: uk.nav.primary })
      .getByRole('link', { name: uk.nav.articles })

    await expect(articles).toHaveAttribute('aria-current', 'page')
  })

  test('drops a non-positive page query', async ({ page }) => {
    await page.goto('/uk/articles?page=0')

    await expect(page).toHaveURL(/\/uk\/articles$/)
    await expect(page.getByRole('heading', { level: 1, name: uk.articles.title })).toBeVisible()
  })

  test('unknown slug is not found', async ({ page }) => {
    await page.goto('/uk/articles/missing-slug')

    await expect(
      page.getByRole('heading', { level: 1, name: uk.errors.notFoundTitle }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: uk.articles.title })).toHaveCount(0)
  })
})
