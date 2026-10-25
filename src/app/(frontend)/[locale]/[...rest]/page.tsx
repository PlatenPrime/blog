import { notFound } from 'next/navigation'

/**
 * An unknown path under `/uk`, `/ru`, or `/en` does not render
 * `[locale]/not-found` by itself. Throwing here puts that localized
 * 404 inside the locale layout.
 */
export default function LocaleCatchAllPage() {
  notFound()
}
