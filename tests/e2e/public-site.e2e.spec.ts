import { expect, test, type Page } from '@playwright/test'

import uk from '../../src/i18n/messages/uk.json'
import { draftArticle, publicArticle, publicNote } from './public-fixtures'

const screenshot = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
}

const otherRooms = [uk.feed.title, uk.articles.title, uk.notes.title, uk.taxonomy.categoriesTitle]

function rootHasClass(page: Page, className: string) {
  return page.evaluate((name) => document.documentElement.classList.contains(name), className)
}

async function settleFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

/** The Next dev badge sits on `main` and is not part of the page. */
async function hideNextDevTools(page: Page) {
  await page.addStyleTag({
    content: 'nextjs-portal { display: none !important; }',
  })
}

/**
 * The fixture date is old on purpose, so a lively database can push the row
 * off the first page. Walk “older” until the title is on the list, then click it.
 */
async function openListedTitle(page: Page, path: string, title: string, nextLabel: string) {
  await page.goto(path)

  const link = page.getByRole('main').getByRole('link', { name: title, exact: true })

  for (let pageNumber = 1; pageNumber <= 30; pageNumber += 1) {
    if ((await link.count()) > 0) {
      await link.click()
      return
    }

    const next = page.getByRole('link', { name: nextLabel, exact: true })
    if ((await next.count()) === 0) break
    await next.click()
  }

  throw new Error(`Public list has no link titled “${title}”.`)
}

test.describe('Public navigation', () => {
  test('walks the header from the home page', async ({ page }) => {
    await page.goto('/uk')

    const primary = page.getByRole('navigation', { name: uk.nav.primary })
    const rooms = [
      { heading: uk.feed.title, href: /\/uk\/feed$/, label: uk.nav.feed },
      { heading: uk.articles.title, href: /\/uk\/articles$/, label: uk.nav.articles },
      { heading: uk.notes.title, href: /\/uk\/notes$/, label: uk.nav.notes },
      {
        heading: uk.taxonomy.categoriesTitle,
        href: /\/uk\/categories$/,
        label: uk.nav.categories,
      },
    ] as const

    for (const room of rooms) {
      const link = primary.getByRole('link', { name: room.label })
      await link.click()

      await expect(page).toHaveURL(room.href)
      await expect(page.getByRole('heading', { level: 1, name: room.heading })).toBeVisible()
      await expect(link).toHaveAttribute('aria-current', 'page')
    }

    const about = primary.getByRole('link', { name: uk.nav.about })
    await about.click()

    await expect(page).toHaveURL(/\/uk\/about$/)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(about).toHaveAttribute('aria-current', 'page')

    const heading = (await page.getByRole('heading', { level: 1 }).innerText()).trim()
    expect(otherRooms).not.toContain(heading)
  })
})

test.describe('Open a published article and note', () => {
  test('opens the article from the list', async ({ page }) => {
    await openListedTitle(page, '/uk/articles', publicArticle.title, uk.articles.next)

    await expect(page).toHaveURL(new RegExp(`/uk/articles/${publicArticle.slug}$`))
    await expect(page.getByRole('heading', { level: 1, name: publicArticle.title })).toBeVisible()
    await expect(page.getByRole('article')).toContainText(publicArticle.body)
  })

  test('opens the note from the list and does not show the article', async ({ page }) => {
    await openListedTitle(page, '/uk/notes', publicNote.title, uk.notes.next)

    await expect(page).toHaveURL(new RegExp(`/uk/notes/${publicNote.slug}$`))
    await expect(page.getByRole('heading', { level: 1, name: publicNote.title })).toBeVisible()
    await expect(
      page.getByRole('article').getByText(uk.notes.kicker, { exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('article')).toContainText(publicNote.body)
    await expect(page.getByRole('heading', { level: 1, name: publicArticle.title })).toHaveCount(0)
  })

  test('hides the draft article from an anonymous reader', async ({ page }) => {
    await page.goto(`/uk/articles/${draftArticle.slug}`)

    await expect(
      page.getByRole('heading', { level: 1, name: uk.errors.notFoundTitle }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: draftArticle.title })).toHaveCount(0)
  })
})

test.describe('Public chrome, light', () => {
  test.use({ colorScheme: 'light' })

  test('matches the light header', async ({ page }) => {
    await page.goto('/uk')

    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await expect(page.getByRole('navigation', { name: uk.nav.language })).toBeVisible()
    await expect(
      page.getByRole('button', { name: uk.nav.themeToDark }).locator('svg'),
    ).toBeVisible()
    await settleFonts(page)

    await expect(page.getByRole('banner')).toHaveScreenshot('public-header-light.png', screenshot)
  })
})

test.describe('Public chrome, dark', () => {
  test.use({ colorScheme: 'dark' })

  test('matches the dark header', async ({ page }) => {
    await page.goto('/uk')

    await expect.poll(() => rootHasClass(page, 'dark')).toBe(true)
    await expect(page.getByRole('navigation', { name: uk.nav.language })).toBeVisible()
    await expect(
      page.getByRole('button', { name: uk.nav.themeToLight }).locator('svg'),
    ).toBeVisible()
    await settleFonts(page)

    await expect(page.getByRole('banner')).toHaveScreenshot('public-header-dark.png', screenshot)
  })
})

test.describe('Design tokens, light', () => {
  test.use({ colorScheme: 'light' })

  test('matches the light specimen', async ({ page }) => {
    await page.goto('/uk/dev/design')

    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await expect(page.getByRole('heading', { level: 1, name: 'Design tokens' })).toBeVisible()
    await hideNextDevTools(page)
    await settleFonts(page)

    await expect(page.locator('main#main')).toHaveScreenshot('public-design-light.png', screenshot)
  })
})

test.describe('Design tokens, dark', () => {
  test.use({ colorScheme: 'dark' })

  test('matches the dark specimen', async ({ page }) => {
    await page.goto('/uk/dev/design')

    await expect.poll(() => rootHasClass(page, 'dark')).toBe(true)
    await expect(page.getByRole('heading', { level: 1, name: 'Design tokens' })).toBeVisible()
    await hideNextDevTools(page)
    await settleFonts(page)

    await expect(page.locator('main#main')).toHaveScreenshot('public-design-dark.png', screenshot)
  })
})

test.describe('Reading columns, light', () => {
  test.use({ colorScheme: 'light' })

  test('matches the article column', async ({ page }) => {
    await page.goto(`/uk/articles/${publicArticle.slug}`)

    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await expect(page.getByRole('heading', { level: 1, name: publicArticle.title })).toBeVisible()
    await expect(page.locator('article time')).toBeVisible()
    await settleFonts(page)

    await expect(page.getByRole('article')).toHaveScreenshot('public-article-light.png', {
      ...screenshot,
      mask: [page.locator('article time')],
    })
  })

  test('matches the note column', async ({ page }) => {
    await page.goto(`/uk/notes/${publicNote.slug}`)

    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await expect(page.getByRole('heading', { level: 1, name: publicNote.title })).toBeVisible()
    await expect(page.locator('article time')).toBeVisible()
    await settleFonts(page)

    await expect(page.getByRole('article')).toHaveScreenshot('public-note-light.png', {
      ...screenshot,
      mask: [page.locator('article time')],
    })
  })
})

test.describe('Not found column, light', () => {
  test.use({ colorScheme: 'light' })

  test('matches the localized 404', async ({ page }) => {
    await page.goto('/uk/no-such-page')

    await expect.poll(() => rootHasClass(page, 'light')).toBe(true)
    await expect(
      page.getByRole('heading', { level: 1, name: uk.errors.notFoundTitle }),
    ).toBeVisible()
    await hideNextDevTools(page)
    await settleFonts(page)

    await expect(page.locator('main#main')).toHaveScreenshot(
      'public-not-found-light.png',
      screenshot,
    )
  })
})
