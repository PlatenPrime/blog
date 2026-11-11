import { expect, test, type Page } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'
import { publicArticle } from './public-fixtures'
import { readSeedUser, type SeedUser } from './readSeedUser'

async function loginAsSeedReader(page: Page): Promise<SeedUser> {
  const user = readSeedUser()
  await page.goto('/login')
  await page.getByLabel(uk.auth.email).fill(user.email)
  await page.getByLabel(uk.auth.password).fill(user.password)
  await page.getByRole('button', { name: uk.auth.login.submit }).click()
  await expect(page).toHaveURL(/\/uk\/?$/)
  return user
}

const articlePath = `/uk/articles/${publicArticle.slug}`

test.describe('Reader features', () => {
  test('guest sees login CTAs on article, bookmarks, and account', async ({ page }) => {
    await page.goto(articlePath)

    const comments = page.getByRole('region', { name: uk.comments.title })
    await expect(comments.getByText(uk.comments.loginPrompt)).toBeVisible()
    await expect(comments.getByRole('link', { name: uk.comments.login })).toBeVisible()
    await expect(comments.getByRole('link', { name: uk.comments.register })).toBeVisible()
    await expect(page.locator('#comment-body')).toHaveCount(0)

    const bookmarks = page.getByRole('region', { name: uk.bookmarks.save })
    await expect(bookmarks.getByText(uk.bookmarks.loginPrompt)).toBeVisible()
    await expect(bookmarks.getByRole('link', { name: uk.bookmarks.login })).toBeVisible()
    await expect(bookmarks.getByRole('button')).toHaveCount(0)

    const banner = page.getByRole('banner')
    await expect(banner.getByRole('link', { name: uk.nav.account })).toHaveCount(0)
    await expect(banner.getByRole('link', { name: uk.nav.bookmarks })).toHaveCount(0)

    await page.goto('/uk/bookmarks')
    await expect(page.getByRole('heading', { level: 1, name: uk.bookmarks.title })).toBeVisible()
    await expect(page.getByText(uk.bookmarks.loginPrompt)).toBeVisible()
    await expect(page.getByRole('heading', { name: uk.errors.notFoundTitle })).toHaveCount(0)

    await page.goto('/uk/account')
    await expect(page.getByRole('heading', { level: 1, name: uk.account.title })).toBeVisible()
    await expect(page.getByText(uk.account.loginPrompt)).toBeVisible()
    await expect(page.getByRole('heading', { name: uk.errors.notFoundTitle })).toHaveCount(0)
  })

  test('verified reader posts a comment on the public article', async ({ page }) => {
    await loginAsSeedReader(page)
    await page.goto(articlePath)

    const body = `E2E comment ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await page.locator('#comment-body').fill(body)
    await page.getByRole('button', { name: uk.comments.submit }).click()

    const comments = page.getByRole('region', { name: uk.comments.title })
    await expect(comments.getByText(uk.comments.you)).toBeVisible()
    await expect(comments.getByText(body)).toBeVisible()
  })

  test('verified reader toggles a bookmark and sees it on /bookmarks', async ({ page }) => {
    await loginAsSeedReader(page)
    await page.goto(articlePath)

    const toggle = page.getByRole('region', { name: uk.bookmarks.save }).getByRole('button')
    await expect(toggle).toBeVisible()

    if ((await toggle.getAttribute('aria-pressed')) === 'true') {
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      await expect(toggle).toHaveText(uk.bookmarks.save)
    }

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(toggle).toHaveText(uk.bookmarks.saved)

    await page.goto('/uk/bookmarks')
    await expect(page.getByRole('heading', { level: 1, name: uk.bookmarks.title })).toBeVisible()
    const row = page.getByRole('listitem').filter({ hasText: publicArticle.title })
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: uk.bookmarks.saved }).click()
    // Wait for the server action + router.refresh; a hard reload races the delete.
    await expect(page.getByRole('link', { name: publicArticle.title })).toHaveCount(0)
    await expect(page.getByRole('status')).toHaveText(uk.bookmarks.empty)
  })

  test('verified reader opens account, reset link, and logs out', async ({ page }) => {
    const { email } = await loginAsSeedReader(page)

    await page.getByRole('banner').getByRole('link', { name: uk.nav.account }).click()
    await expect(page).toHaveURL(/\/uk\/account\/?$/)
    await expect(page.getByRole('heading', { level: 1, name: uk.account.title })).toBeVisible()
    await expect(page.getByText(email, { exact: true })).toBeVisible()

    await page.getByRole('link', { name: uk.account.resetPassword }).click()
    await expect(page).toHaveURL(/\/uk\/forgot-password\/?$/)

    await page.goto('/uk/account')
    // Banner and account page both expose logout — click the in-page control.
    await page.locator('#main').getByRole('link', { name: uk.account.logout }).click()
    await expect(page.getByRole('banner').getByRole('link', { name: uk.nav.login })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: uk.nav.account })).toHaveCount(
      0,
    )
  })
})
