# nestjs-st

Monorepo-практикум: **NestJS** (API) + **TanStack Start** (SSR/SEO) + **Nx**. Подробный план шагов — [`docs/development-roadmap.md`](docs/development-roadmap.md).

## Требования

- Node.js и npm: см. [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) (рекомендуется **20.18.0** из `.nvmrc`).

## Команды (корень репозитория)

```bash
npm install
npm run start:dev    # Nest в workspace api (apps/api)
npm run test
npm run test:e2e
npm run build
npm run nx:show      # проекты Nx (сейчас: api)
npm run nx:build     # то же через nx run api:build
```

Документация: [`docs/README.md`](docs/README.md). Локальная настройка: [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md).
