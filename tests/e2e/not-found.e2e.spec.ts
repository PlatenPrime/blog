import { expect, test } from '@playwright/test'

import en from '../../src/i18n/messages/en.json'
import ru from '../../src/i18n/messages/ru.json'
import uk from '../../src/i18n/messages/uk.json'

const catalogs = [
  { messages: uk, path: '/uk/no-such-page' },
  { messages: ru, path: '/ru/no-such-page' },
  { messages: en, path: '/en/no-such-page' },
] as const

test.describe('Not found', () => {
  test('unknown path is a localized 404 inside the site chrome', async ({ page }) => {
    for (const { messages, path } of catalogs) {
      const response = await page.goto(path)

      expect(response?.status()).toBe(404)
      await expect(
        page.getByRole('heading', { level: 1, name: messages.errors.notFoundTitle }),
      ).toBeVisible()
      await expect(page.getByText(messages.errors.notFoundBody)).toBeVisible()
      await expect(
        page.getByRole('banner').getByRole('link', { name: messages.nav.siteTitle }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: messages.errors.notFoundHome })).toBeVisible()
    }
  })
})
