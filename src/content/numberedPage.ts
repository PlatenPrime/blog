const pagePattern = /^[1-9]\d*$/

export type NumberedPageHref<Path extends string> =
  Path | { pathname: Path; query: { page: string } }

export type NumberedPageResolution =
  { kind: 'redirect'; page: number | null } | { kind: 'render'; page: number }

export function pageCount(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0
  return Math.ceil(total / pageSize)
}

/** First query value. A repeated `page` param does not become a second page. */
export function readPageParam(page: string | string[] | undefined): string | undefined {
  if (Array.isArray(page)) return page[0]
  return page
}

/**
 * Which page to render, or where to send a bad query.
 * `page: null` is the canonical path (no query). `?page=1` redirects there.
 * A page past the end redirects to the last real page.
 */
export function resolveNumberedPage(
  raw: string | undefined,
  total: number,
  pageSize: number,
): NumberedPageResolution {
  if (raw === undefined) return { kind: 'render', page: 1 }

  if (!pagePattern.test(raw)) return { kind: 'redirect', page: null }

  const requested = Number(raw)
  if (!Number.isSafeInteger(requested)) return { kind: 'redirect', page: null }
  if (requested === 1) return { kind: 'redirect', page: null }

  const pages = pageCount(total, pageSize)
  if (pages === 0 || requested > pages) {
    return { kind: 'redirect', page: pages > 1 ? pages : null }
  }

  return { kind: 'render', page: requested }
}

/** Page 1 has no query, so the first page has one URL. */
export function numberedPageHref<Path extends string>(
  pathname: Path,
  page: number,
): NumberedPageHref<Path> {
  if (page <= 1) return pathname
  return { pathname, query: { page: String(page) } }
}
