'use server'

import config from '@payload-config'
import { getLocale, getTranslations } from 'next-intl/server'
import { getPayload, type Payload } from 'payload'

import { isAuthenticatedAndVerified } from '@/access/isVerified'
import { getCurrentUser } from '@/auth/getCurrentUser'
import {
  commentTargetFindArgs,
  normalizeCommentBody,
  readCommentTarget,
  type CommentTarget,
} from '@/content/commentsQuery'

export type CommentActionResult = { ok: true } | { ok: false; error: string }

function readString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Drafts and future posts are not comment targets, even if the form names their id.
 */
async function publishedTargetExists(
  payload: Payload,
  target: CommentTarget,
  locale: string,
): Promise<boolean> {
  const found =
    target.relationTo === 'articles'
      ? await payload.find(
          commentTargetFindArgs({ locale, relationTo: 'articles', value: target.value }),
        )
      : await payload.find(
          commentTargetFindArgs({ locale, relationTo: 'notes', value: target.value }),
        )

  return found.docs.length > 0
}

/**
 * Creates one comment for the signed-in verified user.
 * `author` is the session id, then the collection hook forces it again.
 * `moderationStatus` stays on the default. Neither value is read from the form.
 * Payload error text is not returned to the page.
 */
export async function createCommentAction(formData: FormData): Promise<CommentActionResult> {
  const errors = await getTranslations('errors')
  const bodyResult = normalizeCommentBody(readString(formData, 'body'))

  if (!bodyResult.ok) {
    return {
      error: bodyResult.reason === 'empty' ? errors('commentEmpty') : errors('commentTooLong'),
      ok: false,
    }
  }

  const target = readCommentTarget(
    readString(formData, 'relationTo'),
    readString(formData, 'contentId'),
  )
  if (!target) {
    return { error: errors('commentNotAllowed'), ok: false }
  }

  const user = await getCurrentUser()
  if (!user || !isAuthenticatedAndVerified(user)) {
    return { error: errors('commentNotAllowed'), ok: false }
  }

  try {
    const payload = await getPayload({ config })
    const isPublic = await publishedTargetExists(payload, target, await getLocale())
    if (!isPublic) {
      return { error: errors('commentNotAllowed'), ok: false }
    }

    const content =
      target.relationTo === 'articles'
        ? { relationTo: 'articles' as const, value: target.value }
        : { relationTo: 'notes' as const, value: target.value }

    await payload.create({
      collection: 'comments',
      data: {
        author: user.id,
        body: bodyResult.body,
        content,
        // Schema default. Not read from the form, so a reader cannot submit `hidden`.
        moderationStatus: 'approved',
      },
      overrideAccess: false,
      user,
    })
  } catch {
    return { error: errors('commentFailed'), ok: false }
  }

  return { ok: true }
}
