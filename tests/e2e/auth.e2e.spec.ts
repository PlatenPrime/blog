import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'

import config from '../../src/payload.config'

type SeedUser = { email: string; password: string }

function readSeedUser(): SeedUser {
  const file = path.join(process.cwd(), 'tests/e2e/.auth/reader.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')) as SeedUser
}

test.describe('Auth UI', () => {
  test('register shows verify message', async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const email = `e2e-reg-${suffix}@example.com`

    await page.goto('/register')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('register-password-123')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByRole('status')).toContainText(/verify/i)
  })

  test('login → authenticated home → logout', async ({ page }) => {
    const { email, password } = readSeedUser()

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL(/\/uk\/?$/)
    await expect(page.getByTestId('session-email')).toHaveText(email)

    await page.getByRole('link', { name: 'Log out' }).click()
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible()
    await expect(page.getByTestId('session-email')).toHaveCount(0)
  })

  test('login rejects wrong password', async ({ page }) => {
    const { email } = readSeedUser()

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('definitely-wrong-password')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByRole('alert')).toContainText(/invalid/i)
  })

  test('forgot password shows neutral success', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill('nobody-e2e@example.com')
    await page.getByRole('button', { name: 'Send reset link' }).click()

    await expect(page.getByRole('status')).toContainText(/if an account exists/i)
  })

  test('reset password happy path', async ({ page }) => {
    const payload = await getPayload({ config })
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const email = `e2e-reset-${suffix}@example.com`
    const oldPassword = 'old-password-123'
    const newPassword = 'new-password-456'

    await payload.create({
      collection: 'users',
      data: {
        email,
        password: oldPassword,
        role: 'reader',
        _verified: true,
      },
      overrideAccess: true,
    })

    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email },
      disableEmail: true,
    })

    await page.goto(`/reset-password?token=${encodeURIComponent(token as string)}`)
    await page.getByLabel('Password').fill(newPassword)
    await page.getByRole('button', { name: 'Set new password' }).click()

    await expect(page).toHaveURL(/\/login/)

    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(newPassword)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByTestId('session-email')).toHaveText(email)
  })
})
