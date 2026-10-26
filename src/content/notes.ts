import config from '@payload-config'
import { cache } from 'react'
import { getPayload } from 'payload'

import { toLatestPublicDoc, type LatestPublicDoc } from '@/content/latestPublicQuery'
import {
  notesCountArgs,
  notesDetailFindArgs,
  notesListFindArgs,
  notesPageCount,
  resolveNotesPage,
  toPublicNote,
  type PublicNote,
} from '@/content/notesQuery'

export type PublicNotesResult =
  | { kind: 'redirect'; page: number | null }
  | { items: LatestPublicDoc[]; kind: 'render'; page: number; pageCount: number }

/**
 * One page of published notes for a locale.
 * Counts first, so a page past the end redirects and never becomes a find.
 * Does not receive the session user: see `notesCountArgs` and `notesListFindArgs`.
 */
export const findPublicNotes = cache(
  async (locale: string, rawPage: string | undefined): Promise<PublicNotesResult> => {
    const now = new Date()
    const payload = await getPayload({ config })
    const counted = await payload.count(notesCountArgs({ locale, now }))
    const resolution = resolveNotesPage(rawPage, counted.totalDocs)

    if (resolution.kind === 'redirect') {
      return { kind: 'redirect', page: resolution.page }
    }

    const found = await payload.find(notesListFindArgs({ locale, now, page: resolution.page }))

    return {
      items: found.docs.flatMap((doc) => {
        const item = toLatestPublicDoc(doc)
        return item ? [item] : []
      }),
      kind: 'render',
      page: resolution.page,
      pageCount: notesPageCount(counted.totalDocs),
    }
  },
)

/**
 * One published note, or null when the slug is missing, draft, or still scheduled.
 * Shared by the page and its metadata so one request does not ask twice.
 * Does not receive the session user and does not open draft mode.
 * An article slug is not a note: this find is the notes collection only.
 */
export const findPublicNote = cache(
  async (locale: string, slug: string): Promise<PublicNote | null> => {
    const payload = await getPayload({ config })
    const found = await payload.find(notesDetailFindArgs({ locale, slug }))
    const doc = found.docs[0]
    if (!doc) return null
    return toPublicNote(doc)
  },
)
