import type { Where } from 'payload'

export type BookmarkContentRef = {
  relationTo: 'articles' | 'notes'
  value: number | string
}

/**
 * Normalize polymorphic `content` from create/update data into a stable key.
 * Returns null when content is missing or incomplete.
 */
export function normalizeBookmarkContent(content: unknown): BookmarkContentRef | null {
  if (!content || typeof content !== 'object') return null

  const { relationTo, value } = content as {
    relationTo?: unknown
    value?: unknown
  }

  if (relationTo !== 'articles' && relationTo !== 'notes') return null

  const contentId =
    value != null && typeof value === 'object' && 'id' in value
      ? (value as { id: number | string }).id
      : value

  if (contentId == null || contentId === '') return null

  return {
    relationTo,
    value: contentId as number | string,
  }
}

/**
 * Where clause for finding an existing bookmark with the same (user, content).
 * Optional `excludeId` skips the current doc on update.
 */
export function buildBookmarkDuplicateWhere(args: {
  userId: number | string
  content: BookmarkContentRef
  excludeId?: number | string
}): Where {
  const clauses: Where[] = [
    { user: { equals: args.userId } },
    { 'content.relationTo': { equals: args.content.relationTo } },
    { 'content.value': { equals: args.content.value } },
  ]

  if (args.excludeId != null) {
    clauses.push({ id: { not_equals: args.excludeId } })
  }

  return { and: clauses }
}
