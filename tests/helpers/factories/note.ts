import type { Payload } from 'payload'

import type { Note } from '@/payload-types'

import { lexicalParagraph } from './lexical'
import type { ContentLocale } from './types'
import { uniqueSuffix } from './uniqueSuffix'

export type BuildNoteDataOverrides = {
  title?: string
  slug?: string
  body?: Note['body']
  _status?: 'draft' | 'published'
  publishedAt?: string | null
}

export type CreateNoteOptions = BuildNoteDataOverrides & {
  locale?: ContentLocale
}

/** Pure note create payload (no DB). Defaults: published + Lexical body. */
export function buildNoteData(overrides: BuildNoteDataOverrides = {}) {
  const suffix = uniqueSuffix()
  return {
    title: overrides.title ?? `Test note ${suffix}`,
    slug: overrides.slug ?? `test-note-${suffix}`,
    body: overrides.body ?? lexicalParagraph(`Note body ${suffix}`),
    _status: overrides._status ?? ('published' as const),
    ...(overrides.publishedAt !== undefined ? { publishedAt: overrides.publishedAt } : {}),
  }
}

/** Create a note via Local API; hermetic unique slug by default. */
export async function createTestNote(
  payload: Payload,
  options: CreateNoteOptions = {},
): Promise<Note> {
  const { locale = 'uk', ...dataOverrides } = options
  return (await payload.create({
    collection: 'notes',
    locale,
    data: buildNoteData(dataOverrides),
    overrideAccess: true,
  })) as Note
}
