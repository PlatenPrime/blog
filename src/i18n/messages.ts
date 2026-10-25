import type { AppLocale } from './routing'

import en from './messages/en.json'
import ru from './messages/ru.json'
import uk from './messages/uk.json'

/**
 * Public chrome catalogs. `uk` is the type source (default locale, ADR-004).
 * A missing key in `ru` or `en` fails `tsc`; extra keys are caught by the unit test.
 * Cookie copy is stored here for step 081 and is not rendered yet.
 */
export const messagesByLocale = { uk, ru, en } satisfies Record<AppLocale, typeof uk>
