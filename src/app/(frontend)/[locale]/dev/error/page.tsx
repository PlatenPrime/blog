import { notFound } from 'next/navigation'

/**
 * Throws on purpose so the locale error boundary can be opened by hand.
 * Production answers 404. Playwright does not visit this route:
 * `next dev` also paints the Next overlay on top of the boundary.
 */
export default function DevErrorPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  throw new Error('Development error screen')
}
