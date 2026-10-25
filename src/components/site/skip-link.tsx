import { getTranslations } from 'next-intl/server'

export async function SkipLink() {
  const t = await getTranslations('nav')

  return (
    <a
      className="fixed top-3 left-3 z-50 -translate-y-24 rounded-sm bg-background px-3 py-2 font-sans text-small text-foreground shadow-sm focus:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      href="#main"
    >
      {t('skipToContent')}
    </a>
  )
}
