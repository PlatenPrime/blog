import { expect, test } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'

const origin = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

test.describe('Metadata API', () => {
  test('home exposes bare title, description, and clean canonical', async ({ page }) => {
    await page.goto('/uk')

    await expect(page).toHaveTitle(uk.nav.siteTitle)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      uk.nav.siteDescription,
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}/uk`)
  })

  test('feed list uses section title, description, and canonical without query', async ({
    page,
  }) => {
    await page.goto('/uk/feed?page=1')

    await expect(page).toHaveTitle(`${uk.feed.title} — ${uk.nav.siteTitle}`)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      uk.feed.metaDescription,
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}/uk/feed`)
  })

  test('login has a unique title, canonical, and noindex robots', async ({ page }) => {
    await page.goto('/uk/login')

    await expect(page).toHaveTitle(`${uk.auth.login.title} — ${uk.nav.siteTitle}`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${origin}/uk/login`,
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i)
  })

  test('search with a query stays noindex and canonicalizes to the clean path', async ({
    page,
  }) => {
    await page.goto('/uk/search?q=hello')

    await expect(page).toHaveTitle(`${uk.search.title} — ${uk.nav.siteTitle}`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${origin}/uk/search`,
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i)
  })
})
