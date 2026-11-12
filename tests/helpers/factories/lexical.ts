import type { Article } from '@/payload-types'

/** Minimal Lexical document accepted by Articles/Notes richText. */
export function lexicalParagraph(text: string): Article['body'] {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            },
          ],
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
    },
  }
}
