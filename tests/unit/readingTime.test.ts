/** @vitest-environment node */
import type { SerializedEditorState } from 'lexical'
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_WPM,
  countWords,
  readingTimeFromLexical,
  readingTimeFromPlaintext,
  readingTimeMinutes,
} from '@/lib/readingTime'

describe('countWords', () => {
  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
    expect(countWords('\n\t')).toBe(0)
  })

  it('counts whitespace-separated tokens', () => {
    expect(countWords('one')).toBe(1)
    expect(countWords('one two three')).toBe(3)
    expect(countWords('  spaced   out  ')).toBe(2)
  })
})

describe('readingTimeMinutes', () => {
  it('returns 0 for empty content', () => {
    expect(readingTimeMinutes(0)).toBe(0)
    expect(readingTimeMinutes(-1)).toBe(0)
  })

  it('returns at least 1 minute for any positive word count', () => {
    expect(readingTimeMinutes(1)).toBe(1)
    expect(readingTimeMinutes(199)).toBe(1)
  })

  it('ceil-divides by DEFAULT_WPM', () => {
    expect(DEFAULT_WPM).toBe(200)
    expect(readingTimeMinutes(200)).toBe(1)
    expect(readingTimeMinutes(201)).toBe(2)
    expect(readingTimeMinutes(400)).toBe(2)
    expect(readingTimeMinutes(401)).toBe(3)
  })

  it('accepts a custom words-per-minute rate', () => {
    expect(readingTimeMinutes(100, 100)).toBe(1)
    expect(readingTimeMinutes(101, 100)).toBe(2)
  })
})

describe('readingTimeFromPlaintext', () => {
  it('composes countWords and readingTimeMinutes', () => {
    expect(readingTimeFromPlaintext('')).toBe(0)
    expect(readingTimeFromPlaintext('hello')).toBe(1)
    expect(readingTimeFromPlaintext(Array.from({ length: 201 }, () => 'w').join(' '))).toBe(2)
  })
})

describe('readingTimeFromLexical', () => {
  it('estimates minutes from a minimal Lexical document', () => {
    const data = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'one two three',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    } as unknown as SerializedEditorState

    expect(readingTimeFromLexical(data)).toBe(1)
  })
})
