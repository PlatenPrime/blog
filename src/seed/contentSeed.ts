/**
 * Content seed plan builders (roadmap 102 → 107).
 * Pure logic is unit-tested; DB side lives in `src/scripts/seedContent.ts`.
 *
 * Author-only (ADR-007): no readers / comments / bookmarks.
 * Go-live readiness (107): real About/Privacy/Terms; empty article/note feed.
 */

import { ABOUT_PAGE_SLUG, PRIVACY_PAGE_SLUG, TERMS_PAGE_SLUG } from '../content/pagesQuery'

/** Marker category slug — presence means content seed already ran. */
export const CONTENT_SEED_MARKER_SLUG = 'seed-demo'

export const CONTENT_SEED_COUNTS = {
  categories: 1,
  tags: 0,
  articles: 0,
  notes: 0,
} as const

export type ContentLocale = 'uk' | 'ru' | 'en'

export const CONTENT_LOCALES: readonly ContentLocale[] = ['uk', 'ru', 'en'] as const

export type LocalizedString = Record<ContentLocale, string>

export type ContentSeedDecision = { action: 'seed' } | { action: 'skip'; reason: string }

export type TaxonomySeedItem = {
  slug: string
  title: LocalizedString
}

export type ContentDocSeedItem = {
  slug: string
  title: LocalizedString
  body: LocalizedString
  categoryIndexes: number[]
  tagIndexes: number[]
}

export type PageSeedItem = {
  slug: typeof ABOUT_PAGE_SLUG | typeof PRIVACY_PAGE_SLUG | typeof TERMS_PAGE_SLUG
  title: LocalizedString
  body: LocalizedString
}

export type ContentSeedPlan = {
  categories: TaxonomySeedItem[]
  tags: TaxonomySeedItem[]
  articles: ContentDocSeedItem[]
  notes: ContentDocSeedItem[]
  pages: PageSeedItem[]
}

/**
 * Idempotent gate: seed only when the marker category is absent.
 */
export function decideContentSeed(args: { markerCategoryExists: boolean }): ContentSeedDecision {
  if (args.markerCategoryExists) {
    return {
      action: 'skip',
      reason: `Marker category slug "${CONTENT_SEED_MARKER_SLUG}" already exists.`,
    }
  }

  return { action: 'seed' }
}

/** Lexical document: one paragraph per `\n\n`-separated block (Pages / Articles / Notes richText). */
export function lexicalParagraph(text: string) {
  const blocks = text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
  const paragraphs = (blocks.length > 0 ? blocks : [text]).map((block) => ({
    type: 'paragraph' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'text' as const,
        detail: 0,
        format: 0,
        mode: 'normal' as const,
        style: '',
        text: block,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    textFormat: 0,
    textStyle: '',
  }))

  return {
    root: {
      type: 'root' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: paragraphs,
      direction: 'ltr' as const,
    },
  }
}

const ABOUT_BODY: LocalizedString = {
  uk: [
    'PlatenPrime — особистий блог про розробку: як збирати продукти на сучасному стеку, що працює на практиці, і які рішення варто (і не варто) повторювати.',
    'Тут з’являються статті — довші розбори — і короткі нотатки з дорожніх спостережень. Без інфошуму: один автор, один голос.',
    'Написати можна через кнопку контакту на цій сторінці — вона веде на email, налаштований у середовищі сайту.',
  ].join('\n\n'),
  ru: [
    'PlatenPrime — личный блог о разработке: как собирать продукты на современном стеке, что работает на практике и какие решения стоит (и не стоит) повторять.',
    'Здесь появляются статьи — более длинные разборы — и короткие заметки с дорожных наблюдений. Без инфошума: один автор, один голос.',
    'Написать можно через кнопку контакта на этой странице — она ведёт на email, настроенный в окружении сайта.',
  ].join('\n\n'),
  en: [
    'PlatenPrime is a personal blog about building software: practical stack choices, what holds up in production, and which decisions are worth (and not worth) repeating.',
    'Expect longer articles and shorter notes from the road. One author, one voice — no noise.',
    'You can reach me via the contact link on this page; it uses the site’s configured email address.',
  ].join('\n\n'),
}

const PRIVACY_BODY: LocalizedString = {
  uk: [
    'Ця політика описує, які дані може обробляти сайт PlatenPrime. Це робочий текст для особистого блогу, а не юридична консультація.',
    'Публічної реєстрації читачів, коментарів і закладок немає: сайт авторський. Відвідувачі не створюють облікові записи.',
    'Можуть використовуватися технічні cookies і банер згоди, а також аналітика хостингу (наприклад, Vercel Analytics), якщо вона увімкнена. Деталі згоди керуються інтерфейсом сайту.',
    'Адміністратор входить у /admin; сесія адміна зберігається в cookies автентифікації Payload і потрібна лише для керування контентом.',
    'Питання щодо приватності — через контакт на сторінці «Про автора» (email із налаштувань середовища).',
  ].join('\n\n'),
  ru: [
    'Эта политика описывает, какие данные может обрабатывать сайт PlatenPrime. Это рабочий текст для личного блога, а не юридическая консультация.',
    'Публичной регистрации читателей, комментариев и закладок нет: сайт авторский. Посетители не создают учётные записи.',
    'Могут использоваться технические cookies и баннер согласия, а также аналитика хостинга (например, Vercel Analytics), если она включена. Детали согласия управляются интерфейсом сайта.',
    'Администратор входит в /admin; сессия админа хранится в cookies аутентификации Payload и нужна только для управления контентом.',
    'Вопросы о приватности — через контакт на странице «Об авторе» (email из настроек окружения).',
  ].join('\n\n'),
  en: [
    'This policy describes what data the PlatenPrime site may process. It is working copy for a personal blog, not legal advice.',
    'There is no public reader signup, comments, or bookmarks: this is an author-only site. Visitors do not create accounts.',
    'Technical cookies and a consent banner may be used, along with hosting analytics (for example Vercel Analytics) when enabled. Consent details are controlled in the site UI.',
    'The administrator signs in at /admin; the admin session is stored in Payload auth cookies and is only needed to manage content.',
    'Privacy questions: use the contact control on the About page (email from environment configuration).',
  ].join('\n\n'),
}

const TERMS_BODY: LocalizedString = {
  uk: [
    'Користуючись сайтом PlatenPrime, ви погоджуєтесь з цими умовами. Текст орієнтовний для особистого блогу і не замінює юридичну консультацію.',
    'Увесь опублікований матеріал — авторський контент одного автора. Копіювання великих фрагментів без дозволу небажане; короткі цитати з посиланням — ок.',
    'Сайт і матеріали надаються «як є», без гарантій безперервності чи придатності для конкретної мети.',
    'Облікових записів читачів немає. Питання приватності описані на сторінці Privacy.',
    'Контакт — через сторінку «Про автора».',
  ].join('\n\n'),
  ru: [
    'Пользуясь сайтом PlatenPrime, вы соглашаетесь с этими условиями. Текст ориентировочный для личного блога и не заменяет юридическую консультацию.',
    'Весь опубликованный материал — авторский контент одного автора. Копирование больших фрагментов без разрешения нежелательно; короткие цитаты со ссылкой — ок.',
    'Сайт и материалы предоставляются «как есть», без гарантий непрерывности или пригодности для конкретной цели.',
    'Учётных записей читателей нет. Вопросы приватности описаны на странице Privacy.',
    'Контакт — через страницу «Об авторе».',
  ].join('\n\n'),
  en: [
    'By using the PlatenPrime site you agree to these terms. This is working copy for a personal blog and is not legal advice.',
    'All published material is one author’s content. Please do not republish large excerpts without permission; short quotes with a link are fine.',
    'The site and materials are provided “as is”, without warranties of uptime or fitness for a particular purpose.',
    'There are no reader accounts. Privacy details are on the Privacy page.',
    'Contact: use the About page.',
  ].join('\n\n'),
}

/**
 * Build the go-live content plan (no DB).
 * Marker category keeps seed idempotent; articles/notes stay empty (empty-state UI).
 * Page slugs match public routes: about / privacy / terms.
 */
export function buildContentSeedPlan(): ContentSeedPlan {
  const categories: TaxonomySeedItem[] = [
    {
      slug: CONTENT_SEED_MARKER_SLUG,
      title: {
        uk: 'Seed (маркер)',
        ru: 'Seed (маркер)',
        en: 'Seed (marker)',
      },
    },
  ]

  const pages: PageSeedItem[] = [
    {
      slug: ABOUT_PAGE_SLUG,
      title: {
        uk: 'Про автора',
        ru: 'Об авторе',
        en: 'About',
      },
      body: ABOUT_BODY,
    },
    {
      slug: PRIVACY_PAGE_SLUG,
      title: {
        uk: 'Політика конфіденційності',
        ru: 'Политика конфиденциальности',
        en: 'Privacy Policy',
      },
      body: PRIVACY_BODY,
    },
    {
      slug: TERMS_PAGE_SLUG,
      title: {
        uk: 'Умови використання',
        ru: 'Условия использования',
        en: 'Terms of Use',
      },
      body: TERMS_BODY,
    },
  ]

  return {
    categories,
    tags: [],
    articles: [],
    notes: [],
    pages,
  }
}
