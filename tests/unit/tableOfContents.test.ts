/** @vitest-environment node */
import type { SerializedEditorState } from 'lexical'
import { describe, expect, it } from 'vitest'

import {
  TOC_MIN_ENTRIES,
  TOC_NOTE_MIN_WORDS,
  allocateHeadingId,
  extractTableOfContents,
  headingPlainText,
  shouldShowTableOfContents,
} from '@/lib/tableOfContents'

function textNode(text: string) {
  return {
    type: 'text',
    text,
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    version: 1,
  }
}

function heading(tag: 'h1' | 'h2' | 'h3' | 'h4', children: unknown[]) {
  return {
    type: 'heading',
    tag,
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function editor(children: unknown[]): SerializedEditorState {
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  } as unknown as SerializedEditorState
}

describe('headingPlainText', () => {
  it('joins text and link children', () => {
    expect(
      headingPlainText({
        type: 'heading',
        tag: 'h2',
        children: [
          textNode('Hello '),
          {
            type: 'link',
            children: [textNode('world')],
          },
        ],
      }),
    ).toBe('Hello world')
  })
})

describe('extractTableOfContents', () => {
  it('collects h2/h3 with slug ids and skips h1/h4', () => {
    const data = editor([
      heading('h1', [textNode('Title')]),
      heading('h2', [textNode('First section')]),
      paragraph('body'),
      heading('h3', [textNode('Subsection')]),
      heading('h4', [textNode('Too deep')]),
    ])

    expect(extractTableOfContents(data)).toEqual([
      { id: 'first-section', text: 'First section', depth: 2 },
      { id: 'subsection', text: 'Subsection', depth: 3 },
    ])
  })

  it('slugifies Cyrillic and dedupes identical titles', () => {
    const data = editor([
      heading('h2', [textNode('Вступ')]),
      heading('h2', [textNode('Вступ')]),
      heading('h2', [textNode('!!!')]),
    ])

    expect(extractTableOfContents(data)).toEqual([
      { id: 'vstup', text: 'Вступ', depth: 2 },
      { id: 'vstup-2', text: 'Вступ', depth: 2 },
      { id: 'section', text: '!!!', depth: 2 },
    ])
  })

  it('reads text through link wrappers', () => {
    const data = editor([
      heading('h2', [
        {
          type: 'link',
          children: [textNode('Linked heading')],
        },
      ]),
      heading('h2', [textNode('Other')]),
    ])

    expect(extractTableOfContents(data)[0]).toEqual({
      id: 'linked-heading',
      text: 'Linked heading',
      depth: 2,
    })
  })

  it('skips empty headings', () => {
    const data = editor([heading('h2', [textNode('   ')]), heading('h2', [textNode('Real')])])
    expect(extractTableOfContents(data)).toEqual([{ id: 'real', text: 'Real', depth: 2 }])
  })
})

describe('allocateHeadingId', () => {
  it('matches extractTableOfContents for the same sequence', () => {
    const seen = new Map<string, number>()
    const data = editor([
      heading('h2', [textNode('Alpha')]),
      heading('h3', [textNode('Alpha')]),
      heading('h2', [textNode('Beta')]),
    ])
    const extracted = extractTableOfContents(data)
    const allocated = ['Alpha', 'Alpha', 'Beta'].map((t) => allocateHeadingId(t, seen))
    expect(allocated).toEqual(extracted.map((e) => e.id))
  })
})

describe('shouldShowTableOfContents', () => {
  const two = [
    { id: 'a', text: 'A', depth: 2 as const },
    { id: 'b', text: 'B', depth: 2 as const },
  ]

  it('requires at least TOC_MIN_ENTRIES', () => {
    expect(TOC_MIN_ENTRIES).toBe(2)
    expect(
      shouldShowTableOfContents({ entries: two.slice(0, 1), surface: 'article', wordCount: 0 }),
    ).toBe(false)
    expect(shouldShowTableOfContents({ entries: two, surface: 'article', wordCount: 0 })).toBe(true)
  })

  it('gates notes by TOC_NOTE_MIN_WORDS', () => {
    expect(TOC_NOTE_MIN_WORDS).toBe(300)
    expect(
      shouldShowTableOfContents({
        entries: two,
        surface: 'note',
        wordCount: TOC_NOTE_MIN_WORDS - 1,
      }),
    ).toBe(false)
    expect(
      shouldShowTableOfContents({
        entries: two,
        surface: 'note',
        wordCount: TOC_NOTE_MIN_WORDS,
      }),
    ).toBe(true)
  })
})
