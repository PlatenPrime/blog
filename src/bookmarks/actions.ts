'use server'

import config from '@payload-config'
import { getLocale, getTranslations } from 'next-intl/server'
import { getPayload, type Payload } from 'payload'

import { isAuthenticatedAndVerified } from '@/access/isVerified'
import { getCurrentUser } from '@/auth/getCurrentUser'
import { commentTargetFindArgs, readCommentTarget } from '@/content/commentsQuery'
import {
  bookmarkForContentFindArgs,
  bookmarkWriteFailure,
  type BookmarkRelation,
} from '@/content/bookmarksQuery'

export type BookmarkActionResult = { ok: true; saved: boolean } | { ok: false; error: string }

function readString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Drafts and future posts are not bookmark targets, even if the form names their id.
 */
async function publishedTargetExists(
  payload: Payload,
  relationTo: BookmarkRelation,
  value: number,
  locale: string,
): Promise<boolean> {
  const found =
    relationTo === 'articles'
      ? await payload.find(commentTargetFindArgs({ locale, relationTo: 'articles', value }))
      : await payload.find(commentTargetFindArgs({ locale, relationTo: 'notes', value }))

  return found.docs.length > 0
}

/**
 * Saves or removes the signed-in verified user's bookmark on one article or note.
 * `user` comes from the session, then the collection hook forces it again.
 * A duplicate create is already saved. A delete of a missing row is already gone.
 * Payload error text is not returned to the page.
 */
export async function toggleBookmarkAction(formData: FormData): Promise<BookmarkActionResult> {
  const errors = await getTranslations('errors')
  const target = readCommentTarget(
    readString(formData, 'relationTo'),
    readString(formData, 'contentId'),
  )
  if (!target) {
    return { error: errors('bookmarkNotAllowed'), ok: false }
  }

  const user = await getCurrentUser()
  if (!user || !isAuthenticatedAndVerified(user)) {
    return { error: errors('bookmarkNotAllowed'), ok: false }
  }

  try {
    const payload = await getPayload({ config })
    const isPublic = await publishedTargetExists(
      payload,
      target.relationTo,
      target.value,
      await getLocale(),
    )
    if (!isPublic) {
      return { error: errors('bookmarkNotAllowed'), ok: false }
    }

    const existing = await payload.find(
      bookmarkForContentFindArgs({
        relationTo: target.relationTo,
        user,
        value: target.value,
      }),
    )
    const row = existing.docs[0]

    if (row) {
      try {
        await payload.delete({
          collection: 'bookmarks',
          id: row.id,
          overrideAccess: false,
          user,
        })
      } catch (error) {
        if (bookmarkWriteFailure(error) === 'gone') return { ok: true, saved: false }
        throw error
      }

      return { ok: true, saved: false }
    }

    const content =
      target.relationTo === 'articles'
        ? { relationTo: 'articles' as const, value: target.value }
        : { relationTo: 'notes' as const, value: target.value }

    try {
      await payload.create({
        collection: 'bookmarks',
        data: {
          content,
          user: user.id,
        },
        overrideAccess: false,
        user,
      })
    } catch (error) {
      if (bookmarkWriteFailure(error) === 'saved') return { ok: true, saved: true }
      throw error
    }

    return { ok: true, saved: true }
  } catch {
    return { error: errors('bookmarkFailed'), ok: false }
  }
}
