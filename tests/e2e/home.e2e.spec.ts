import { expect, test, type Page } from '@playwright/test'

import en from '../../src/i18n/messages/en.json'
import ru from '../../src/i18n/messages/ru.json'
import uk from '../../src/i18n/messages/uk.json'

const catalogs = [
  { messages: uk, path: '/uk' },
  { messages: ru, path: '/ru' },
  { messages: en, path: '/en' },
] as const

function rootHasClass(page: Page, className: string) {
  return page.evaluate((name) => document.documentElement.classList.contains(name), className)
}

test.describe('Home', () => {
  test('uses the author name as the brand in every locale', async ({ page }) => {
    for (const { messages, path } of catalogs) {
      await page.goto(path)

      await expect(page).toHaveTitle(messages.nav.siteTitle)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(messages.nav.siteTitle)
      await expect(page.getByTestId('home-hero')).toContainText(messages.nav.siteDescription)
      await expect(
        page.getByRole('banner').getByRole('link', { name: messages.nav.siteTitle }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: messages.nav.logoutEverywhere })).toHaveCount(0)
    }
  })
})

test.describe('Home hero, light', () => {
  test.use({ colorScheme: 'light' })

  test('matches the light composition', async ({ page }) => {
    await page.goto('/uk')
    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await page.evaluate(async () => {
      await document.fonts.ready
    })

    await expect(page.getByTestId('home-hero')).toHaveScreenshot('home-hero-light.png', {
      animations: 'disabled',
      caret: 'hide',
    })
  })
})

test.describe('Home hero, dark', () => {
  test.use({ colorScheme: 'dark' })

  test('matches the dark composition', async ({ page }) => {
    await page.goto('/uk')
    await expect.poll(() => rootHasClass(page, 'dark')).toBe(true)
    await page.evaluate(async () => {
      await document.fonts.ready
    })

    await expect(page.getByTestId('home-hero')).toHaveScreenshot('home-hero-dark.png', {
      animations: 'disabled',
      caret: 'hide',
    })
  })
})
