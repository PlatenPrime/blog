import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'

import en from '../../src/i18n/messages/en.json'
import ru from '../../src/i18n/messages/ru.json'
import uk from '../../src/i18n/messages/uk.json'
import config from '../../src/payload.config'
import { createVerifiedReader, uniqueSuffix } from '../factories'
import { readSeedUser } from './readSeedUser'

test.describe('Auth UI', () => {
  test('login chrome follows the locale prefix', async ({ page }) => {
    await page.goto('/ru/login')
    await expect(page.getByRole('heading', { name: ru.auth.login.title })).toBeVisible()
    await expect(page.getByRole('button', { name: ru.auth.login.submit })).toBeVisible()

    await page.goto('/en/login')
    await expect(page.getByRole('heading', { name: en.auth.login.title })).toBeVisible()
    await expect(page.getByRole('button', { name: en.auth.login.submit })).toBeVisible()
  })

  test('register shows verify message', async ({ page }) => {
    const email = `e2e-reg-${uniqueSuffix()}@example.com`

    await page.goto('/register')
    await page.getByLabel(uk.auth.email).fill(email)
    await page.getByLabel(uk.auth.password).fill('register-password-123')
    await page.getByRole('button', { name: uk.auth.register.submit }).click()

    await expect(page.getByRole('status')).toContainText(uk.auth.register.success)
  })

  test('login → authenticated home → logout', async ({ page }) => {
    const { email, password } = readSeedUser()

    await page.goto('/login')
    await page.getByLabel(uk.auth.email).fill(email)
    await page.getByLabel(uk.auth.password).fill(password)
    await page.getByRole('button', { name: uk.auth.login.submit }).click()

    await expect(page).toHaveURL(/\/uk\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(uk.nav.siteTitle)
    await expect(page.getByTestId('session-email')).toHaveCount(0)
    await expect(page.getByRole('button', { name: uk.nav.logoutEverywhere })).toBeVisible()

    await page.getByRole('banner').getByRole('link', { name: uk.nav.logout }).click()
    await expect(page.getByRole('banner').getByRole('link', { name: uk.nav.login })).toBeVisible()
    await expect(page.getByTestId('session-email')).toHaveCount(0)
    await expect(page.getByRole('button', { name: uk.nav.logoutEverywhere })).toHaveCount(0)
  })

  test('login rejects wrong password', async ({ page }) => {
    const { email } = readSeedUser()

    await page.goto('/login')
    await page.getByLabel(uk.auth.email).fill(email)
    await page.getByLabel(uk.auth.password).fill('definitely-wrong-password')
    await page.getByRole('button', { name: uk.auth.login.submit }).click()

    await expect(page.locator('p.auth-error')).toContainText(uk.errors.invalidCredentials)
  })

  test('forgot password shows neutral success', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel(uk.auth.email).fill('nobody-e2e@example.com')
    await page.getByRole('button', { name: uk.auth.forgot.submit }).click()

    await expect(page.getByRole('status')).toContainText(uk.auth.forgot.success)
  })

  test('reset password happy path', async ({ page }) => {
    const payload = await getPayload({ config })
    const email = `e2e-reset-${uniqueSuffix()}@example.com`
    const oldPassword = 'old-password-123'
    const newPassword = 'new-password-456'

    await createVerifiedReader(payload, { email, password: oldPassword })

    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email },
      disableEmail: true,
    })

    await page.goto(`/reset-password?token=${encodeURIComponent(token as string)}`)
    await page.getByLabel(uk.auth.password).fill(newPassword)
    await page.getByRole('button', { name: uk.auth.reset.submit }).click()

    await expect(page).toHaveURL(/\/login/)

    await page.getByLabel(uk.auth.email).fill(email)
    await page.getByLabel(uk.auth.password).fill(newPassword)
    await page.getByRole('button', { name: uk.auth.login.submit }).click()

    await expect(page).toHaveURL(/\/uk\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(uk.nav.siteTitle)
    await expect(page.getByRole('banner').getByRole('link', { name: uk.nav.logout })).toBeVisible()
  })
})
