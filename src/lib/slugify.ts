/**
 * URL-safe slug from a title. Supports Latin + common Cyrillic (uk/ru).
 * Spaces and underscores become hyphens; other punctuation is dropped.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya',
  ы: 'y',
  э: 'e',
  ё: 'yo',
  ъ: '',
}

function transliterateCyrillic(input: string): string {
  let out = ''
  for (const char of input) {
    const lower = char.toLowerCase()
    const mapped = CYRILLIC_TO_LATIN[lower]
    if (mapped !== undefined) {
      out += mapped
      continue
    }
    out += char
  }
  return out
}

export function slugify(input: string): string {
  return transliterateCyrillic(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
