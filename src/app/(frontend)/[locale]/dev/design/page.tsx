import type { Metadata } from 'next'

import { ThemeSpecimen } from './theme-specimen'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Design system',
}

/**
 * Dev scaffold for step 046. Not product chrome and not linked from the nav.
 * Both themes are on the page at once; the site toggle is step 047.
 */
export default function DesignSmokePage() {
  return (
    <div className="bg-background font-sans text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-small text-muted-foreground">
          Dev scaffold. Not product chrome. The theme toggle is a later step.
        </p>
        <h1 className="mt-2 font-serif text-h1">Design tokens</h1>
        <p className="mt-3 max-w-measure font-serif text-lead text-muted-foreground">
          The same specimen in light and dark. Reading is serif. Controls are sans.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ThemeSpecimen tone="light" />
          <ThemeSpecimen tone="dark" />
        </div>
      </div>
    </div>
  )
}
