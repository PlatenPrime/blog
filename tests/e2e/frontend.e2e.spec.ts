import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('home loads', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Blog/)

    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Blog')
  })
})
