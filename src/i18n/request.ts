import { getRequestConfig } from 'next-intl/server'

import { messagesByLocale } from './messages'
import { resolveAppLocale } from './resolveAppLocale'

/** Locale and chrome catalog for Server Components. */
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveAppLocale(await requestLocale)

  return {
    locale,
    messages: messagesByLocale[locale],
  }
})
