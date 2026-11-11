import type { Payload } from 'payload'

import type { Comment, User } from '../../src/payload-types'

export type CreateCommentInput = {
  author: User
  content: {
    relationTo: 'articles' | 'notes'
    value: number
  }
  body: string
  moderationStatus?: 'approved' | 'hidden'
}

/**
 * Creates a comment as the given session user (`overrideAccess: false`).
 * Author is taken from the session by the collection hook; `author` on data
 * is still required by the type and must not be trusted by callers as spoofable.
 */
export async function createComment(payload: Payload, input: CreateCommentInput): Promise<Comment> {
  return payload.create({
    collection: 'comments',
    user: input.author,
    overrideAccess: false,
    data: {
      content: input.content,
      body: input.body,
      author: input.author.id,
      moderationStatus: input.moderationStatus ?? 'approved',
    },
  })
}
