import { expect, test } from '@playwright/test'

const BASELINE_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'content-security-policy',
] as const

test.describe('Security headers', () => {
  test('public locale response exposes baseline headers and public CSP', async ({ request }) => {
    const response = await request.get('/uk')
    expect(response.ok()).toBeTruthy()

    const headers = response.headers()
    for (const name of BASELINE_HEADERS) {
      expect(headers[name], name).toBeTruthy()
    }

    expect(headers['x-frame-options'].toLowerCase()).toBe('deny')
    expect(headers['x-content-type-options'].toLowerCase()).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')

    const csp = headers['content-security-policy']
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain('youtube-nocookie.com')
    expect(csp).not.toContain("'unsafe-eval'")
  })

  test('admin response uses softer CSP with unsafe-eval', async ({ request }) => {
    const response = await request.get('/admin')
    // Redirect to login is fine; headers must still be present.
    expect(response.status()).toBeLessThan(500)

    const headers = response.headers()
    for (const name of BASELINE_HEADERS) {
      expect(headers[name], name).toBeTruthy()
    }

    const csp = headers['content-security-policy']
    expect(csp).toContain("'unsafe-eval'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  test('home loads without CSP violations in the console', async ({ page }) => {
    const cspViolations: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (/content security policy|csp/i.test(text)) {
        cspViolations.push(text)
      }
    })

    const response = await page.goto('/uk')
    expect(response?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
    expect(cspViolations).toEqual([])
  })
})
