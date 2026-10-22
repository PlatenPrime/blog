import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('home loads for each locale prefix', async ({ page }) => {
    for (const locale of ['uk', 'ru', 'en'] as const) {
      await page.goto(`/${locale}`)

      await expect(page).toHaveTitle(/Blog/)
      await expect(page.getByTestId('active-locale')).toHaveText(`Locale: ${locale}`)
      const heading = page.locator('h1').first()
      await expect(heading).toHaveText('Blog')
    }
  })

  test('root redirects into a locale prefix', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/(uk|ru|en)\/?$/)
  })
})
