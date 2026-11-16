/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const revalidateTag = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({
  revalidateTag,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import { CONTENT_CACHE_TAGS } from '@/cache/contentTags'
import { revalidatePublicContentForDoc } from '@/hooks/revalidatePublicContent'
import { logger } from '@/lib/logger'

describe('revalidatePublicContentForDoc', () => {
  beforeEach(() => {
    revalidateTag.mockReset()
    vi.mocked(logger.warn).mockReset()
  })

  it('purges expected tags with immediate expire', () => {
    const tags = revalidatePublicContentForDoc({ collection: 'articles', id: 42 })

    expect(tags).toEqual([
      CONTENT_CACHE_TAGS.articles,
      'article:42',
      CONTENT_CACHE_TAGS.home,
      CONTENT_CACHE_TAGS.feed,
    ])
    expect(revalidateTag).toHaveBeenCalledTimes(4)
    expect(revalidateTag).toHaveBeenCalledWith(CONTENT_CACHE_TAGS.articles, { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('article:42', { expire: 0 })
  })

  it('ignores unknown collections', () => {
    expect(revalidatePublicContentForDoc({ collection: 'media', id: 1 })).toEqual([])
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('logs and continues when revalidateTag throws', () => {
    revalidateTag.mockImplementation(() => {
      throw new Error('cache unavailable')
    })

    expect(revalidatePublicContentForDoc({ collection: 'notes', id: 3 })).toEqual([
      CONTENT_CACHE_TAGS.notes,
      'note:3',
      CONTENT_CACHE_TAGS.home,
      CONTENT_CACHE_TAGS.feed,
    ])
    expect(logger.warn).toHaveBeenCalledWith(
      'content_cache_revalidate_failed',
      expect.objectContaining({ collection: 'notes', id: 3 }),
    )
  })
})
