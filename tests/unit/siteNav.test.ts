/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { isSiteNavItemCurrent, siteNavItems } from '@/components/site/site-nav'

describe('site nav paths', () => {
  it('keeps the public section contract', () => {
    expect(siteNavItems.map((item) => [item.href, item.labelKey])).toEqual([
      ['/feed', 'feed'],
      ['/articles', 'articles'],
      ['/notes', 'notes'],
      ['/categories', 'categories'],
      ['/about', 'about'],
    ])
  })

  it('marks the section and its children, not a longer sibling prefix', () => {
    expect(isSiteNavItemCurrent('/notes', '/notes')).toBe(true)
    expect(isSiteNavItemCurrent('/notes/hello', '/notes')).toBe(true)
    expect(isSiteNavItemCurrent('/notes-extra', '/notes')).toBe(false)
    expect(isSiteNavItemCurrent('/', '/feed')).toBe(false)
    expect(isSiteNavItemCurrent('/articles', '/feed')).toBe(false)
  })
})
