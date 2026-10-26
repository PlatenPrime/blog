/**
 * Stable public documents for the Playwright suite.
 * Setup overwrites only these slugs. Other rows in the database stay put.
 * Factories for arbitrary users and comments stay on step 087.
 */
export const publicPublishedAt = '2020-01-15T12:00:00.000Z'

export const publicArticle = {
  body: 'Абзац e2e-статті.',
  slug: 'e2e-public-article',
  title: 'E2E стаття',
} as const

export const publicNote = {
  body: 'Абзац e2e-нотатки.',
  slug: 'e2e-public-note',
  title: 'E2E нотатка',
} as const

export const draftArticle = {
  body: 'Абзац e2e-чернетки.',
  slug: 'e2e-draft-article',
  title: 'E2E чернетка',
} as const
