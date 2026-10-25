import { test, expect } from '@playwright/test'

import en from '../../src/i18n/messages/en.json'
import ru from '../../src/i18n/messages/ru.json'
import uk from '../../src/i18n/messages/uk.json'

test.describe('Language switcher', () => {
  test('switches locale on the same logical page', async ({ page }) => {
    await page.goto('/ru/login')

    await expect(page.getByRole('heading', { name: ru.auth.login.title })).toBeVisible()

    const switcher = page.getByRole('navigation', { name: ru.nav.language })
    await expect(switcher.getByText(ru.nav.localeRu, { exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await switcher.getByRole('link', { name: ru.nav.localeEn }).click()

    await expect(page).toHaveURL(/\/en\/login\/?$/)
    await expect(page.getByRole('heading', { name: en.auth.login.title })).toBeVisible()

    const enSwitcher = page.getByRole('navigation', { name: en.nav.language })
    await expect(enSwitcher.getByText(en.nav.localeEn, { exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('preserves pathname and query when switching locale', async ({ page }) => {
    await page.goto('/uk/forgot-password?from=switcher')

    await expect(page.getByRole('heading', { name: uk.auth.forgot.title })).toBeVisible()

    const switcher = page.getByRole('navigation', { name: uk.nav.language })
    await switcher.getByRole('link', { name: uk.nav.localeRu }).click()

    await expect(page).toHaveURL(/\/ru\/forgot-password\/?\?from=switcher/)
    await expect(page.getByRole('heading', { name: ru.auth.forgot.title })).toBeVisible()
  })
})
