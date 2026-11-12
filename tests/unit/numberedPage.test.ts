/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  numberedPageHref,
  pageCount,
  readPageParam,
  resolveNumberedPage,
} from '@/content/numberedPage'

describe('pageCount', () => {
  it('returns 0 for empty total or non-positive page size', () => {
    expect(pageCount(0, 10)).toBe(0)
    expect(pageCount(-1, 10)).toBe(0)
    expect(pageCount(10, 0)).toBe(0)
    expect(pageCount(10, -5)).toBe(0)
  })

  it('ceils total over page size', () => {
    expect(pageCount(1, 10)).toBe(1)
    expect(pageCount(10, 10)).toBe(1)
    expect(pageCount(11, 10)).toBe(2)
    expect(pageCount(25, 10)).toBe(3)
  })
})

describe('readPageParam', () => {
  it('returns the scalar value', () => {
    expect(readPageParam('2')).toBe('2')
    expect(readPageParam(undefined)).toBeUndefined()
  })

  it('takes the first value when the param is repeated', () => {
    expect(readPageParam(['3', '9'])).toBe('3')
    expect(readPageParam([])).toBeUndefined()
  })
})

describe('resolveNumberedPage', () => {
  it('renders page 1 when the query is absent', () => {
    expect(resolveNumberedPage(undefined, 25, 10)).toEqual({ kind: 'render', page: 1 })
  })

  it('redirects garbage and page=1 to the canonical path', () => {
    expect(resolveNumberedPage('0', 25, 10)).toEqual({ kind: 'redirect', page: null })
    expect(resolveNumberedPage('-1', 25, 10)).toEqual({ kind: 'redirect', page: null })
    expect(resolveNumberedPage('abc', 25, 10)).toEqual({ kind: 'redirect', page: null })
    expect(resolveNumberedPage('1.5', 25, 10)).toEqual({ kind: 'redirect', page: null })
    expect(resolveNumberedPage('01', 25, 10)).toEqual({ kind: 'redirect', page: null })
    expect(resolveNumberedPage('1', 25, 10)).toEqual({ kind: 'redirect', page: null })
  })

  it('renders an in-range page greater than 1', () => {
    expect(resolveNumberedPage('2', 25, 10)).toEqual({ kind: 'render', page: 2 })
    expect(resolveNumberedPage('3', 25, 10)).toEqual({ kind: 'render', page: 3 })
  })

  it('redirects past the end to the last real page, or null when empty', () => {
    expect(resolveNumberedPage('99', 25, 10)).toEqual({ kind: 'redirect', page: 3 })
    expect(resolveNumberedPage('2', 5, 10)).toEqual({ kind: 'redirect', page: null })
    expect(resolveNumberedPage('2', 0, 10)).toEqual({ kind: 'redirect', page: null })
  })
})

describe('numberedPageHref', () => {
  it('returns a bare path for page 1 or below', () => {
    expect(numberedPageHref('/uk/articles', 1)).toBe('/uk/articles')
    expect(numberedPageHref('/uk/articles', 0)).toBe('/uk/articles')
  })

  it('adds a page query for later pages', () => {
    expect(numberedPageHref('/uk/articles', 2)).toEqual({
      pathname: '/uk/articles',
      query: { page: '2' },
    })
  })
})
