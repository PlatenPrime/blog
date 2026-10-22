import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Pure helper: when saving as published without a publish time, stamp `now`.
 * Does not overwrite an existing or explicitly provided `publishedAt`.
 */
export function applyPublishedAtOnPublish(args: {
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown> | null
  now?: Date
}): Record<string, unknown> {
  const { data, originalDoc, now = new Date() } = args

  const nextStatus = (data._status ?? originalDoc?._status) as string | undefined
  if (nextStatus !== 'published') return data

  const fromData = data.publishedAt
  const fromOriginal = originalDoc?.publishedAt

  const hasDataValue = fromData != null && fromData !== ''
  const hasOriginalValue = fromOriginal != null && fromOriginal !== ''

  if (hasDataValue || hasOriginalValue) return data

  return {
    ...data,
    publishedAt: now.toISOString(),
  }
}

/**
 * Stamp `publishedAt` on publish when the author left it empty (roadmap 036).
 */
export const setPublishedAtOnPublish: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data

  return applyPublishedAtOnPublish({
    data: data as Record<string, unknown>,
    originalDoc: (originalDoc as Record<string, unknown> | null | undefined) ?? null,
  })
}
