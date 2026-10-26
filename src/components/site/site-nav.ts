/**
 * Canonical public sections.
 * `/feed` is the mixed list. `/articles` and `/notes` are each a list and a reading page.
 * Categories and about open in steps 053–054.
 * Until then a click on those two hits the localized not-found page.
 */
export const siteNavItems = [
  { href: '/feed', labelKey: 'feed' },
  { href: '/articles', labelKey: 'articles' },
  { href: '/notes', labelKey: 'notes' },
  { href: '/categories', labelKey: 'categories' },
  { href: '/about', labelKey: 'about' },
] as const satisfies readonly {
  href: `/${string}`
  labelKey: 'about' | 'articles' | 'categories' | 'feed' | 'notes'
}[]

export type SiteNavItem = (typeof siteNavItems)[number]

export const siteChromeLinkClassName =
  'rounded-sm px-0.5 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * A section is current on its index and on any future child path (`/notes/slug`).
 * A sibling prefix (`/notes-extra`) does not match.
 */
export function isSiteNavItemCurrent(pathname: string, href: SiteNavItem['href']): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
