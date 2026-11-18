const ink = [
  'font-serif text-body text-foreground',
  '[&_h2]:font-sans [&_h2]:text-h2 [&_h2]:text-pretty [&_h2]:wrap-break-word',
  '[&_h3]:font-sans [&_h3]:text-h3 [&_h3]:text-pretty [&_h3]:wrap-break-word',
  '[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline',
  '[&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:list-decimal [&_ol]:pl-6',
  '[&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
  '[&_img]:h-auto [&_img]:max-w-full',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-small',
  '[&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-small',
].join(' ')

/** Document title. Manrope; the prose under it stays Source Serif 4. */
export const readingTitleClassName = 'm-0 font-sans text-pretty wrap-break-word text-foreground'

/**
 * One prose rhythm for article, note, and page.
 * Notes keep the same faces and a tighter margin so a short text does not look like a chapter.
 * Paragraphs stay on solid ink: no gradient, no fill.
 */
export function readingProseClassName(density: 'reading' | 'note'): string {
  if (density === 'note') {
    return [
      'mt-8',
      ink,
      '[&_h2]:mt-8 [&_h2]:mb-3',
      '[&_h3]:mt-6 [&_h3]:mb-2',
      '[&_p]:my-3',
      '[&_ul]:my-3 [&_ol]:my-3',
      '[&_blockquote]:my-4',
      '[&_img]:my-4',
      '[&_.payload-richtext-youtube]:my-4',
      '[&_.payload-richtext-code]:my-4',
    ].join(' ')
  }

  return [
    'mt-12',
    ink,
    '[&_h2]:mt-10 [&_h2]:mb-4',
    '[&_h3]:mt-8 [&_h3]:mb-3',
    '[&_p]:my-4',
    '[&_ul]:my-4 [&_ol]:my-4',
    '[&_blockquote]:my-6',
    '[&_img]:my-6',
    '[&_.payload-richtext-youtube]:my-6',
    '[&_.payload-richtext-code]:my-6',
  ].join(' ')
}
