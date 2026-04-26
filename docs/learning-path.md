# Learning Path

Обучение идёт **по master roadmap разработки**: каждый шаг = один спринт с кодом, проверками и файлом урока. Источник истины по нумерации и составу шагов — [`development-roadmap.md`](./development-roadmap.md).

## Как читать этот файл

- **Фазы ниже** — логическая группировка для студента (удобно для «большой картины»).
- **Конкретный порядок работ** — только таблица шагов `001–320` в roadmap.
- Уроки лежат в [`docs/lessons/`](./lessons/); имя файла: `lesson-NNN-topic.md` (NNN = номер шага из roadmap).

## Phase 1: Monorepo и фундамент (Track 0)

Соответствует шагам **001–032** в roadmap: корневой workspace, Nx, перенос Nest в `apps/api`, scaffold TanStack Start, CI, документация.

- Старт: [`lesson-001-root-npm-workspaces.md`](./lessons/lesson-001-root-npm-workspaces.md)

## Phase 2: Платформа API (Track 1)

Шаги **033–056**: конфигурация, health, единый формат ошибок, валидация, логирование, основа API v1.

## Phase 3: Аутентификация и роли (Track 2)

Шаги **057–104**: пользователи, пароли, JWT + refresh, сессии, RBAC, сценарии безопасности.

## Phase 4: CMS и редактор на backend (Track 3)

Шаги **105–164**: посты (черновики, публикация, slug, SEO), теги и категории, комментарии, модерация, контракты для фронта.

## Phase 5: Публичный сайт на TanStack Start (Track 4)

Шаги **165–200**: SSR, SEO, лента и страница поста, sitemap, кеширование и revalidate.

## Phase 6: Админка и редактор (Track 5)

Шаги **201–252**: студия, полноценный UX редактора, автосохранение, превью, публикация, модерация в UI.

## Phase 7: Масштаб и данные (Track 6)

Шаги **253–278**: индексы, производительность запросов, кеш, CDN-заголовки.

## Phase 8: Надёжность и продакшен (Tracks 7–8)

- **Track 7** (**279–302**): throttling, security hardening, health, метрики, наблюдаемость.
- **Track 8** (**303–320**): Docker, CI/CD, релизы, capstone review.

## Шаблон и правила уроков

- [Lesson authoring guide](./lesson-authoring-guide.md)
- [Lesson template](./lessons/lesson-template.md)
