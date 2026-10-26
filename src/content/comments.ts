import config from '@payload-config'
import { cache } from 'react'
import { getPayload } from 'payload'

import { commentsFindArgs, type CommentRelation } from '@/content/commentsQuery'

/**
 * Approved comments for one public article or note, newest first.
 * The page turns that window around. Does not receive the session user.
 * Arguments are primitives so one request reuses the lookup.
 */
export const findApprovedComments = cache(
  async (relationTo: CommentRelation, contentId: number) => {
    const payload = await getPayload({ config })
    const found = await payload.find(commentsFindArgs({ relationTo, value: contentId }))
    return found.docs
  },
)
