/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { highlightCode, normalizeCodeLanguage } from '@/lib/codeHighlight'

describe('normalizeCodeLanguage', () => {
  it('keeps curated Shiki ids', () => {
    expect(normalizeCodeLanguage('ts')).toBe('ts')
    expect(normalizeCodeLanguage('TSX')).toBe('tsx')
    expect(normalizeCodeLanguage(' bash ')).toBe('bash')
  })

  it('maps common aliases', () => {
    expect(normalizeCodeLanguage('typescript')).toBe('ts')
    expect(normalizeCodeLanguage('javascript')).toBe('js')
    expect(normalizeCodeLanguage('shell')).toBe('bash')
    expect(normalizeCodeLanguage('markdown')).toBe('md')
    expect(normalizeCodeLanguage('yml')).toBe('yaml')
  })

  it('falls back to plaintext for unknown or empty input', () => {
    expect(normalizeCodeLanguage('brainfuck')).toBe('plaintext')
    expect(normalizeCodeLanguage('')).toBe('plaintext')
    expect(normalizeCodeLanguage('   ')).toBe('plaintext')
    expect(normalizeCodeLanguage(null)).toBe('plaintext')
    expect(normalizeCodeLanguage(undefined)).toBe('plaintext')
  })
})

describe('highlightCode', () => {
  it('returns dual-theme HTML with shiki class', async () => {
    const { html, language } = await highlightCode('const x = 1', 'ts')
    expect(language).toBe('ts')
    expect(html).toContain('class="shiki')
    expect(html).toContain('--shiki-dark')
    expect(html).toContain('const')
  })

  it('highlights unknown language as plaintext', async () => {
    const { html, language } = await highlightCode('hello', 'no-such-lang')
    expect(language).toBe('plaintext')
    expect(html).toContain('class="shiki')
    expect(html).toContain('hello')
  })
})
