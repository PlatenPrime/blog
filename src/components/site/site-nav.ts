/**
 * Canonical public sections.
 * `/feed` is the mixed list. `/articles` and `/notes` are each a list and a reading page.
 * `/categories` is the category index and its shelves. `/tags` is the tag index,
 * linked from the category index and from reading pages, and stays out of this list.
 * `/about` is the CMS page whose slug is `about` (step 054).
 * Privacy and terms are the same collection and stay out of this list (079–080).
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
