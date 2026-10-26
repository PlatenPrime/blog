/**
 * Editorial date for a public list. A missing or unparseable instant is omitted
 * by the caller; it is not rendered as "Invalid Date".
 */
export function formatPublishedOn(iso: string, locale: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
