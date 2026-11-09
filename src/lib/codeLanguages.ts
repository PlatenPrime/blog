/** Curated languages for Lexical Code blocks + Shiki (roadmap 064). Keys match Shiki ids. */
export const CODE_BLOCK_LANGUAGES = {
  plaintext: 'Plain Text',
  ts: 'TypeScript',
  tsx: 'TSX',
  js: 'JavaScript',
  jsx: 'JSX',
  bash: 'Bash',
  json: 'JSON',
  css: 'CSS',
  html: 'HTML',
  md: 'Markdown',
  sql: 'SQL',
  python: 'Python',
  yaml: 'YAML',
  dockerfile: 'Dockerfile',
  go: 'Go',
  rust: 'Rust',
} as const

export type CodeHighlightLanguage = keyof typeof CODE_BLOCK_LANGUAGES
