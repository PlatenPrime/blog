import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'

import { getServerUrl } from '@/auth/serverUrl'
import { JsonLd } from '@/components/seo/json-ld'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { SkipLink } from '@/components/site/skip-link'
import { themeInitScript } from '@/components/theme/theme-init-script'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { buildLocaleShellJsonLd } from '@/content/jsonLd'
import { absoluteRssFeedUrl, rssOrigin } from '@/content/rssQuery'
import { routing } from '@/i18n/routing'

import '../globals.css'
import '../styles.css'

const sourceSerif = Source_Serif_4({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  style: ['italic', 'normal'],
  variable: '--font-source-serif',
  weight: ['400', '600'],
})

const sourceSans = Source_Sans_3({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  style: ['italic', 'normal'],
  variable: '--font-source-sans',
  weight: ['400', '500', '600'],
})

type LocaleLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
  const t = await getTranslations({ locale: resolved, namespace: 'nav' })

  return {
    alternates: {
      types: {
        'application/rss+xml': absoluteRssFeedUrl(rssOrigin(), resolved, 'all'),
      },
    },
    description: t('siteDescription'),
    metadataBase: new URL(getServerUrl()),
    title: t('siteTitle'),
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const [messages, nav] = await Promise.all([getMessages(), getTranslations('nav')])
  const jsonLd = buildLocaleShellJsonLd({
    contactEmail: process.env.CONTACT_EMAIL,
    description: nav('siteDescription'),
    locale,
    name: nav('siteTitle'),
    origin: getServerUrl(),
  })

  return (
    <html
      className={`${sourceSerif.variable} ${sourceSans.variable}`}
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={jsonLd} />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <div className="flex min-h-dvh flex-col">
              <SkipLink />
              <SiteHeader />
              <main className="flex-1 outline-none" id="main" tabIndex={-1}>
                {children}
              </main>
              <SiteFooter />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
