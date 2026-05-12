# apps/web — TanStack Start (SSR/SEO)

Публичный сайт блога: TanStack Start (Vite 8 + Nitro) + React 19 + Tailwind 4 + TanStack Router (file-based routing). Workspace входит в Nx-граф под именем `web`.

Канонический entry point — Nx-таргеты с корня репозитория (кеширование, `dependsOn` `web:build` → `shared-contracts:build`, единый CI-интерфейс). Workspace-local команды оставлены как escape hatch для отладки.

## Run (preferred — from repo root)

```bash
npm run web:dev              # npm -w web run dev  -> vite dev --port 3000
npx nx run web:build         # production-сборка (Vite + Nitro)
npx nx run web:typecheck     # tsc --noEmit (см. lesson-011)
```

Список Nx-целей: `npm run nx:show` и `npm run nx:graph` с корня.

## Run (workspace-local, отладка)

```bash
npm -w web run dev
npm -w web run build
npm -w web run preview        # vite preview production-сборки
npm -w web run test           # vitest run
npm -w web run lint
npm -w web run format         # prettier + eslint --fix
```

## Environment

Web и API разнесены по **разным** `.env*` файлам — это физический guardrail против утечки серверных секретов (`POSTGRES_*`, будущий `JWT_SECRET`) в client-бандл через `import.meta.env`.

- Шаблон — [`apps/web/.env.example`](.env.example). Реальный `.env` коммитом не уходит (см. [`apps/web/.gitignore`](.gitignore)).
- **Vite namespace contract**:
  - `VITE_PUBLIC_*` — инжектится в client-бандл (виден в браузере). Только для нечувствительных данных.
  - Без префикса `VITE_*` — server-only (Nitro/SSR). Не попадает в JS, который скачивает браузер.
- Полный разбор контракта — [lesson-017](../../docs/lessons/lesson-017-env-example-files.md).

## Routing

File-based routing через TanStack Router: каждый файл в `src/routes/` становится маршрутом. Корневой layout — `src/routes/__root.tsx`. Для навигации внутри SPA — компонент `<Link to="...">` из `@tanstack/react-router`. Подробнее: [TanStack Router docs](https://tanstack.com/router/latest).

## Styling, testing, linting

- **Styling**: Tailwind CSS 4 через `@tailwindcss/vite`-плагин, базовые стили в `src/styles.css`.
- **Testing**: Vitest 4 + React Testing Library + jsdom (`npm -w web run test`).
- **Linting / formatting**: ESLint 9 (`@tanstack/eslint-config`) + Prettier 3. С корня — `npm run format:check` (`apps/web/src`, `apps/web/public`, ряд `apps/web/*` файлов входит в общий Prettier-glob — см. [`package.json`](../../package.json)).

## See also

- Root [README](../../README.md) — runbook монорепо.
- [`docs/development-roadmap.md`](../../docs/development-roadmap.md) — план шагов.
- [`docs/LOCAL_SETUP.md`](../../docs/LOCAL_SETUP.md) — детальный setup.
- Релевантные уроки: [010](../../docs/lessons/lesson-010-apps-web-tanstack-start.md), [011](../../docs/lessons/lesson-011-web-typecheck-target.md), [012](../../docs/lessons/lesson-012-shared-contracts-lib.md), [014](../../docs/lessons/lesson-014-wire-shared-contracts-web.md), [017](../../docs/lessons/lesson-017-env-example-files.md).
- Upstream-документация TanStack: [Start](https://tanstack.com/start), [Router](https://tanstack.com/router/latest), [Query](https://tanstack.com/query/latest).
