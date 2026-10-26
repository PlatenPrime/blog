import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

test.describe('Notes', () => {
  test('renders the note list instead of the article list', async ({ page }) => {
    await page.goto('/uk/notes')

    await expect(page).toHaveTitle(`${uk.notes.title} — ${uk.nav.siteTitle}`)
    await expect(page.getByRole('heading', { level: 1, name: uk.notes.title })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: uk.articles.title })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: uk.errors.notFoundTitle })).toHaveCount(0)

    const notes = page
      .getByRole('navigation', { name: uk.nav.primary })
      .getByRole('link', { name: uk.nav.notes })

    await expect(notes).toHaveAttribute('aria-current', 'page')
  })

  test('drops a non-positive page query', async ({ page }) => {
    await page.goto('/uk/notes?page=0')

    await expect(page).toHaveURL(/\/uk\/notes$/)
    await expect(page.getByRole('heading', { level: 1, name: uk.notes.title })).toBeVisible()
  })

  test('unknown slug is not found', async ({ page }) => {
    await page.goto('/uk/notes/missing-slug')

    await expect(
      page.getByRole('heading', { level: 1, name: uk.errors.notFoundTitle }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: uk.notes.title })).toHaveCount(0)
  })
})
