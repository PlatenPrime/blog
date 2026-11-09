import { createHighlighter, type Highlighter } from 'shiki'

import { CODE_BLOCK_LANGUAGES, type CodeHighlightLanguage } from '@/lib/codeLanguages'

export type { CodeHighlightLanguage }

const ALLOWED_LANGS = new Set<string>(Object.keys(CODE_BLOCK_LANGUAGES))

/** Aliases authors / Monaco / markdown fences may send → curated Shiki id. */
const LANGUAGE_ALIASES: Record<string, CodeHighlightLanguage> = {
  typescript: 'ts',
  javascript: 'js',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash',
  markdown: 'md',
  text: 'plaintext',
  txt: 'plaintext',
  plain: 'plaintext',
  yml: 'yaml',
  docker: 'dockerfile',
  py: 'python',
}

const LIGHT_THEME = 'github-light'
const DARK_THEME = 'github-dark'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [LIGHT_THEME, DARK_THEME],
      langs: [...ALLOWED_LANGS],
    })
  }
  return highlighterPromise
}

/**
 * Map free-form language labels to a curated Shiki id. Unknown → plaintext.
 */
export function normalizeCodeLanguage(language: string | null | undefined): CodeHighlightLanguage {
  if (typeof language !== 'string') return 'plaintext'
  const key = language.trim().toLowerCase()
  if (!key) return 'plaintext'
  if (ALLOWED_LANGS.has(key)) return key as CodeHighlightLanguage
  return LANGUAGE_ALIASES[key] ?? 'plaintext'
}

/**
 * Server-side dual-theme HTML (`github-light` + `github-dark` CSS variables).
 * Theme switching is CSS-only via `html.dark` (roadmap 064).
 */
export async function highlightCode(
  code: string,
  language?: string | null,
): Promise<{ html: string; language: CodeHighlightLanguage }> {
  const lang = normalizeCodeLanguage(language)
  const highlighter = await getHighlighter()
  const html = highlighter.codeToHtml(code, {
    lang,
    themes: {
      light: LIGHT_THEME,
      dark: DARK_THEME,
    },
    defaultColor: false,
  })
  return { html, language: lang }
}
