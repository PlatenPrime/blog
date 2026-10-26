import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Taxonomy', () => {
  test('renders the category index and opens the tag index from it', async ({ page }) => {
    await page.goto('/uk/categories')

    await expect(page).toHaveTitle(`${uk.taxonomy.categoriesTitle} — ${uk.nav.siteTitle}`)
    await expect(
      page.getByRole('heading', { level: 1, name: uk.taxonomy.categoriesTitle }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: uk.errors.notFoundTitle })).toHaveCount(0)

    const categories = page
      .getByRole('navigation', { name: uk.nav.primary })
      .getByRole('link', { name: uk.nav.categories })

    await expect(categories).toHaveAttribute('aria-current', 'page')

    await page.getByRole('main').locator('a[href="/uk/tags"]').click()

    await expect(page).toHaveURL(/\/uk\/tags$/)
    await expect(page).toHaveTitle(`${uk.taxonomy.tagsTitle} — ${uk.nav.siteTitle}`)
    await expect(page.getByRole('heading', { level: 1, name: uk.taxonomy.tagsTitle })).toBeVisible()
    await expect(categories).not.toHaveAttribute('aria-current', 'page')
  })

  test('unknown category slug is not found', async ({ page }) => {
    await page.goto('/uk/categories/missing-slug')

    await expect(
      page.getByRole('heading', { level: 1, name: uk.errors.notFoundTitle }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: uk.taxonomy.categoriesTitle }),
    ).toHaveCount(0)
  })

  test('unknown tag slug is not found', async ({ page }) => {
    await page.goto('/uk/tags/missing-slug')

    await expect(
      page.getByRole('heading', { level: 1, name: uk.errors.notFoundTitle }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: uk.taxonomy.tagsTitle })).toHaveCount(
      0,
    )
  })
})
