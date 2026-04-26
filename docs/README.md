# NestJS + TanStack Start Practice Track

Репозиторий — практический **fullstack** трек: NestJS API + TanStack Start (SSR/SEO) + Nx monorepo, в формате *learn by building* для платформы **Blog/CMS**.

## Цель

Построить production-minded платформу и по пути разобрать:

- NestJS: модули, DI, контроллеры, валидация, guards, auth, домен CMS;
- TanStack Start: публичный блог и админ-редактор с сильным SEO;
- Nx: граф задач, библиотеки `libs/*`, CI и качество;
- Тестирование, безопасность, наблюдаемость, поставка в прод.

## Документация

| Документ | Назначение |
|----------|------------|
| [`development-roadmap.md`](./development-roadmap.md) | **Master-план разработки**: шаги 001–320, треки, проверки |
| [`learning-path.md`](./learning-path.md) | Фазы обучения и ссылки на roadmap |
| [`lesson-authoring-guide.md`](./lesson-authoring-guide.md) | Стандарт урока-спринта |
| [`lessons/lesson-template.md`](./lessons/lesson-template.md) | Шаблон урока |
| [`lessons/`](./lessons/) | Уроки по шагам (`lesson-NNN-...md`) |

## Быстрый старт (после шага 001)

Из **корня** репозитория:

```bash
npm install
npm run start:dev
```

Тесты:

```bash
npm run test
npm run test:e2e
```

Подробности шага 001: [`lessons/lesson-001-root-npm-workspaces.md`](./lessons/lesson-001-root-npm-workspaces.md).

## Текущий прогесс (высокий уровень)

- [x] Документационный каркас и master roadmap.
- [x] Шаг 001: корневой npm workspace + скрипты оркестрации.
- [ ] Шаг 002+: Nx, перенос API, scaffold web — см. roadmap.
