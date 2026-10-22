/**
 * Shared Admin UX labels/groups for a single-author CMS (roadmap 033).
 * RU/EN terms for Payload admin chrome; content locales (uk/ru/en) are separate (Track 4).
 */

export const adminGroups = {
  content: { en: 'Content', ru: 'Контент' },
  taxonomy: { en: 'Taxonomy', ru: 'Таксономия' },
  community: { en: 'Community', ru: 'Сообщество' },
  system: { en: 'System', ru: 'Система' },
} as const

export function collectionLabels(
  en: { singular: string; plural: string },
  ru: { singular: string; plural: string },
) {
  return {
    singular: { en: en.singular, ru: ru.singular },
    plural: { en: en.plural, ru: ru.plural },
  }
}
