import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { SerializedEditorState } from 'lexical'
import type { CollectionBeforeChangeHook } from 'payload'

/**
 * When `body` is present on the write, derive localized `searchText` for ILIKE.
 * Partial updates without `body` leave `searchText` alone.
 */
export function applySearchTextFromBody(data: Record<string, unknown>): Record<string, unknown> {
  const body = data.body
  if (!isLexicalBody(body)) return data

  return {
    ...data,
    searchText: convertLexicalToPlaintext({ data: body }),
  }
}

function isLexicalBody(value: unknown): value is SerializedEditorState {
  return typeof value === 'object' && value !== null && 'root' in value
}

/** Keep a denormalized plaintext copy of Lexical `body` for public search (066). */
export const setSearchTextFromBody: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data
  return applySearchTextFromBody(data as Record<string, unknown>)
}
