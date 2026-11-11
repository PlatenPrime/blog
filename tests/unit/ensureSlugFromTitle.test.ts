/** @vitest-environment node */
import type { CollectionBeforeValidateHook } from 'payload'
import { describe, expect, it } from 'vitest'

import { ensureSlugFromTitle } from '@/collections/taxonomyFields'
import { slugify } from '@/lib/slugify'

type HookArgs = Parameters<CollectionBeforeValidateHook>[0]

function run(data: HookArgs['data'] | null) {
  return ensureSlugFromTitle({ data } as HookArgs)
}

describe('ensureSlugFromTitle', () => {
  it('passes through falsy data', () => {
    expect(run(undefined)).toBeUndefined()
    expect(run(null)).toBeNull()
  })

  it('fills empty slug from title via slugify', () => {
    const data = { title: 'Hello World', slug: '' }
    expect(run(data)).toEqual({ title: 'Hello World', slug: slugify('Hello World') })
  })

  it('fills whitespace-only slug from title', () => {
    const data = { title: 'Привіт світ', slug: '   ' }
    expect(run(data)).toEqual({ title: 'Привіт світ', slug: slugify('Привіт світ') })
  })

  it('keeps an existing non-empty slug', () => {
    const data = { title: 'Hello World', slug: 'custom-slug' }
    expect(run(data)).toEqual({ title: 'Hello World', slug: 'custom-slug' })
  })

  it('does not invent a slug without a string title', () => {
    expect(run({ slug: '' })).toEqual({ slug: '' })
    expect(run({ title: 42, slug: '' })).toEqual({ title: 42, slug: '' })
  })

  it('leaves empty slug when title slugifies to empty', () => {
    const data = { title: '!!!', slug: '' }
    expect(run(data)).toEqual({ title: '!!!', slug: '' })
  })
})
