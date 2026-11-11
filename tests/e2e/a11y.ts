import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

import { COOKIE_CONSENT_STORAGE_KEY } from '../../src/lib/cookie-consent'

/** Dismiss cookie banner before a11y scan so chrome of the page under test is measured. */
export async function dismissCookieConsent(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key }) => {
      window.localStorage.setItem(key, 'accepted')
    },
    { key: COOKIE_CONSENT_STORAGE_KEY },
  )
}

function formatCriticalViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `    - ${node.target.join(' ')}: ${node.failureSummary ?? ''}`)
        .join('\n')
      return `${violation.id} (${violation.impact}): ${violation.help}\n${nodes}`
    })
    .join('\n\n')
}

/** Fail only on axe impact === critical (roadmap 085 floor). */
export async function expectNoCriticalA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze()
  const critical = results.violations.filter((violation) => violation.impact === 'critical')

  expect(critical, formatCriticalViolations(critical)).toEqual([])
}
