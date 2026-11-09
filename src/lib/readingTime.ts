import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { SerializedEditorState } from 'lexical'

/** Words per minute for the reading-time estimate (Medium-style default). */
export const DEFAULT_WPM = 200

/**
 * Count whitespace-separated tokens. Empty / whitespace-only → 0.
 */
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/**
 * Minutes to read `wordCount` at `wordsPerMinute`.
 * Empty text → 0; any positive word count → at least 1.
 */
export function readingTimeMinutes(
  wordCount: number,
  wordsPerMinute: number = DEFAULT_WPM,
): number {
  if (wordCount <= 0) return 0
  const wpm = wordsPerMinute > 0 ? wordsPerMinute : DEFAULT_WPM
  return Math.max(1, Math.ceil(wordCount / wpm))
}

/** Reading time from already-extracted plain text. */
export function readingTimeFromPlaintext(
  text: string,
  wordsPerMinute: number = DEFAULT_WPM,
): number {
  return readingTimeMinutes(countWords(text), wordsPerMinute)
}

/** Reading time from a Lexical editor state (article/note body). */
export function readingTimeFromLexical(
  data: SerializedEditorState,
  wordsPerMinute: number = DEFAULT_WPM,
): number {
  return readingTimeFromPlaintext(convertLexicalToPlaintext({ data }), wordsPerMinute)
}
