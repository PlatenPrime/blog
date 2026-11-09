import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import { slugify } from '@/lib/slugify'

/** Minimum TOC entries before the nav is worth showing. */
export const TOC_MIN_ENTRIES = 2

/** Notes only: word-count floor for showing TOC (≈1.5 min at 200 WPM). */
export const TOC_NOTE_MIN_WORDS = 300

const TOC_HEADING_TAGS = new Set(['h2', 'h3'])

export type TocSurface = 'article' | 'note'

export type TocEntry = {
  /** Fragment id without `#` — matches heading `id` in rich text. */
  id: string
  /** Visible heading text. */
  text: string
  /** 2 for h2, 3 for h3. */
  depth: 2 | 3
}

type LexicalLike = {
  type?: string
  tag?: string
  text?: string
  children?: LexicalLike[]
}

/**
 * Collect plain text from a Lexical subtree (text nodes + link/inline wrappers).
 */
export function headingPlainText(node: unknown): string {
  const n = node as LexicalLike
  if (typeof n.text === 'string') return n.text
  if (!Array.isArray(n.children)) return ''
  return n.children.map(headingPlainText).join('')
}

function isTocHeadingTag(tag: string | undefined): tag is 'h2' | 'h3' {
  return tag === 'h2' || tag === 'h3'
}

function nextAnchorId(base: string, seen: Map<string, number>): string {
  const key = base || 'section'
  const count = seen.get(key) ?? 0
  seen.set(key, count + 1)
  if (count === 0) return key
  return `${key}-${count + 1}`
}

/**
 * Walk Lexical JSON in document order and assign stable slug ids to h2/h3.
 * Same algorithm must drive TOC links and heading `id` attributes.
 */
export function extractTableOfContents(data: SerializedEditorState): TocEntry[] {
  const entries: TocEntry[] = []
  const seen = new Map<string, number>()

  const visit = (nodes: SerializedLexicalNode[] | undefined) => {
    if (!nodes) return
    for (const node of nodes) {
      const n = node as LexicalLike
      if (n.type === 'heading' && isTocHeadingTag(n.tag)) {
        const text = headingPlainText(n).trim()
        if (text) {
          const id = nextAnchorId(slugify(text), seen)
          entries.push({
            depth: n.tag === 'h2' ? 2 : 3,
            id,
            text,
          })
        }
      }
      if (Array.isArray(n.children)) {
        visit(n.children as SerializedLexicalNode[])
      }
    }
  }

  visit(data.root.children as SerializedLexicalNode[])
  return entries
}

/**
 * Whether the TOC nav should render for this surface.
 * Articles: ≥2 headings. Notes: ≥2 headings and ≥300 words.
 */
export function shouldShowTableOfContents(args: {
  entries: readonly TocEntry[]
  surface: TocSurface
  wordCount: number
}): boolean {
  if (args.entries.length < TOC_MIN_ENTRIES) return false
  if (args.surface === 'note' && args.wordCount < TOC_NOTE_MIN_WORDS) return false
  return true
}

/** True when this heading tag participates in TOC anchors. */
export function isTocHeading(tag: string): boolean {
  return TOC_HEADING_TAGS.has(tag)
}

/**
 * Allocate the next TOC heading id (document-order), matching `extractTableOfContents`.
 * Call once per h2/h3 with non-empty trimmed text during rich-text conversion.
 */
export function allocateHeadingId(text: string, seen: Map<string, number>): string {
  return nextAnchorId(slugify(text.trim()), seen)
}
