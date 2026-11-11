import { expect, test } from '@playwright/test'

import { dismissCookieConsent, expectNoCriticalA11yViolations } from './a11y'
import { publicArticle } from './public-fixtures'

const pages = [
  { name: 'home', path: '/uk' },
  { name: 'article', path: `/uk/articles/${publicArticle.slug}` },
  { name: 'login', path: '/uk/login' },
] as const

test.describe('A11y smoke', () => {
  for (const { name, path } of pages) {
    test(`${name}: landmarks and no critical axe violations`, async ({ page }) => {
      await dismissCookieConsent(page)
      await page.goto(path)

      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.locator('main#main')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()

      await expectNoCriticalA11yViolations(page)
    })
  }
})
