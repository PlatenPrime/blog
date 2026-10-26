import config from '@payload-config'
import { cache } from 'react'
import { getPayload } from 'payload'

import {
  bookmarkContentIds,
  bookmarkForContentFindArgs,
  bookmarkTitlesFindArgs,
  bookmarksListFindArgs,
  toBookmarkListItems,
  type BookmarkListItem,
  type BookmarkRelation,
} from '@/content/bookmarksQuery'
import type { User } from '@/payload-types'

/**
 * This user's bookmarks that still point at a public article or note.
 * Titles are a second find without the session, so a draft does not become a line.
 */
export const findBookmarkList = cache(
  async (locale: string, user: User): Promise<BookmarkListItem[]> => {
    const payload = await getPayload({ config })
    const now = new Date()
    const found = await payload.find(bookmarksListFindArgs(user))
    const ids = bookmarkContentIds(found.docs)
    const [articles, notes] = await Promise.all([
      ids.articles.length === 0
        ? Promise.resolve([])
        : payload
            .find(
              bookmarkTitlesFindArgs({
                collection: 'articles',
                ids: ids.articles,
                locale,
                now,
              }),
            )
            .then((result) => result.docs),
      ids.notes.length === 0
        ? Promise.resolve([])
        : payload
            .find(
              bookmarkTitlesFindArgs({
                collection: 'notes',
                ids: ids.notes,
                locale,
                now,
              }),
            )
            .then((result) => result.docs),
    ])

    return toBookmarkListItems(found.docs, articles, notes)
  },
)

/**
 * Whether this user already saved this public document.
 * Access runs as `user`; the where still names that same id.
 */
export const findOwnBookmark = cache(
  async (user: User, relationTo: BookmarkRelation, contentId: number): Promise<boolean> => {
    const payload = await getPayload({ config })
    const found = await payload.find(
      bookmarkForContentFindArgs({ relationTo, user, value: contentId }),
    )
    return found.docs.length > 0
  },
)
