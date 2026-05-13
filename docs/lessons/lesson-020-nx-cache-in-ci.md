# Lesson 020: Nx cache in CI

## Learning Goal

Закрепить кеширование **Nx task outputs** в GitHub Actions без подключения внешнего сервиса. После шага 019 CI уже проверяет весь baseline; теперь повторные прогоны должны переиспользовать `.nx/cache`, чтобы одинаковые `build`, `test`, `lint` и `typecheck` targets не выполнялись с нуля.

## Implementation Scope

В скоупе шага:

- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): отдельный `actions/cache` для `.nx/cache`.
- Явный `NX_CACHE_DIRECTORY=.nx/cache` на уровне job, чтобы CI и документация говорили об одном пути.
- Документация: этот урок, индексы, roadmap, root README и next-step pointer в [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md).

Намеренно **не** делаем в этом шаге:

- Nx Cloud / remote cache с access token. Для текущего учебного шага достаточно GitHub Actions cache.
- `nx affected` в CI. Это следующий шаг 021.
- Кеширование `.nx/workspace-data`. Это служебные данные Nx daemon/project graph, а не переносимый task output cache.
- Новые npm-пакеты и новые секреты GitHub Actions.

## Dependencies

- GitHub Actions: `actions/cache@v4`.
- Существующий workflow `CI` из шага 019.
- Nx `22.7.0` из корневого [`package.json`](../../package.json).
- Node/npm как в [`.nvmrc`](../../.nvmrc), [`.node-version`](../../.node-version) и `engines`.

## Step-by-Step Changes

1. **Добавить явный путь Nx cache.** В job `baseline` задать `NX_CACHE_DIRECTORY: .nx/cache`.
2. **Восстановить кеш после `npm ci`.** Добавить шаг `Restore Nx cache` перед Nx targets, чтобы `.nx/cache` был доступен для `lint`, `typecheck`, `build`, `test`.
3. **Стабилизировать cache key.** Привязать key к `runner.os`, `package-lock.json`, `nx.json`, root/package manifests и workspace package manifests.
4. **Оставить baseline-команды без изменения.** `npm run ci` и workflow всё ещё выполняют полный набор проверок, а не `nx affected`.
5. **Синхронизировать docs.** Добавить урок 020 в индексы и перевести next roadmap step на 021.

## Code Example

Фрагмент workflow с отдельным кешем Nx:

```yaml
env:
  NX_CACHE_DIRECTORY: .nx/cache

steps:
  - name: Restore Nx cache
    uses: actions/cache@v4
    with:
      path: .nx/cache
      key: nx-${{ runner.os }}-${{ hashFiles('package-lock.json', 'nx.json', 'package.json', 'apps/**/package.json', 'libs/**/package.json') }}
      restore-keys: |
        nx-${{ runner.os }}-
```

## Context

Шаг 019 собрал единый CI baseline: tests-first gate, Prettier, ESLint, typecheck, build, unit и e2e tests. Это правильная «дверь качества», но каждый run заново выполняет одни и те же Nx targets.

У Nx уже включён локальный cache для `build`, `test` и `lint` в [`nx.json`](../../nx.json). Проблема в том, что GitHub-hosted runner стартует с чистой файловой системой. Без `actions/cache` папка `.nx/cache` исчезает между CI runs.

## Concept

**npm cache и Nx cache решают разные задачи.**

- `actions/setup-node` с `cache: npm` ускоряет установку зависимостей, но не хранит результаты `nx run ...`.
- `.nx/cache` хранит outputs задач Nx: собранные файлы, stdout/stderr и metadata hash inputs.
- Cache hit корректен только если inputs совпадают. Поэтому key завязан на lockfile и Nx/package manifests.

## Code Changes

- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): добавлен `NX_CACHE_DIRECTORY` и шаг `Restore Nx cache`.
- [`README.md`](../../README.md): статус и quality notes обновлены для шага 020.
- [`docs/development-roadmap.md`](../development-roadmap.md): step 020 отмечен как завершённый и добавлен в snapshot.
- [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md): next step переведён на 021.
- [`docs/README.md`](../README.md) и [`docs/learning-path.md`](../learning-path.md): добавлена ссылка на урок 020.
- Этот файл: [`docs/lessons/lesson-020-nx-cache-in-ci.md`](./lesson-020-nx-cache-in-ci.md).

## Why This Matters

CI должен быть не только строгим, но и дешёвым в повторении. Nx cache снижает время feedback loop для одинаковых inputs, не ослабляя quality gate. Это особенно важно перед шагом 021: когда появится `nx affected`, кеш и affected-flow будут работать вместе, но отвечать за разные уровни оптимизации.

## Architecture Notes

**Локальный cache вместо Nx Cloud.** GitHub Actions cache проще для учебного шага: нет секретов, внешнего аккаунта и vendor-specific настройки. Минус - cache scoped к GitHub Actions и не шарится с локальными машинами.

**Key завязан на конфигурацию, а не на исходники.** Исходники уже участвуют во внутреннем Nx hash. Если добавить весь `apps/**` в key, кеш будет инвалидироваться почти на каждый коммит и потеряет смысл.

**Не кешируем `.nx/workspace-data`.** Эти файлы относятся к project graph/daemon state и могут быть platform/runtime specific. Для переносимых CI hits нужен только `.nx/cache`.

## Changed Files

| File                                                                          | Action  |
| ----------------------------------------------------------------------------- | ------- |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)                  | changed |
| [`README.md`](../../README.md)                                                | changed |
| [`docs/development-roadmap.md`](../development-roadmap.md)                    | changed |
| [`docs/LOCAL_SETUP.md`](../LOCAL_SETUP.md)                                    | changed |
| [`docs/README.md`](../README.md)                                              | changed |
| [`docs/learning-path.md`](../learning-path.md)                                | changed |
| [`docs/lessons/lesson-020-nx-cache-in-ci.md`](./lesson-020-nx-cache-in-ci.md) | created |

## Verification

Этот шаг инфраструктурный, а не изменение бизнес-логики. Unit-тест здесь не добавляется: корректность проверяется workflow logs и локальными Nx cache commands.

1. `npm run format:check` - exit 0, документация и workflow отформатированы.
2. `npx nx reset` - локальный cache очищен перед smoke-проверкой.
3. `npx nx run api:build` - первый запуск выполняет target.
4. `npx nx run api:build` - второй запуск должен показать Nx cache replay, например `existing outputs match the cache`.
5. После push: GitHub Actions → `CI` → первый run создаёт cache, повторный run показывает restore step (`Cache restored from key...`) и Nx cache hit/replay в логах targets.

## TDD Sequence

TDD в классическом Red/Green/Refactor виде не применяется: нет новой runtime-логики или публичного API. Вместо этого используем infrastructure verification:

- Red equivalent: baseline CI из шага 019 не имеет restore/save `.nx/cache`.
- Green: добавить `actions/cache` для `.nx/cache` и получить restore/cache-hit evidence.
- Refactor: оставить key минимальным и документировать границы кеша.

## Definition of Done

- [x] Workflow `CI` восстанавливает и сохраняет `.nx/cache` через `actions/cache`.
- [x] `npm run ci` остаётся полной baseline-проверкой и не переходит на `nx affected`.
- [x] Roadmap и индексы отражают завершение step 020.
- [x] `docs/LOCAL_SETUP.md` указывает на step 021 как следующий шаг.
- [x] Урок 020 содержит обязательные секции Sprint Lesson Contract.

## What To Remember

- npm cache ускоряет зависимости; Nx cache ускоряет результаты задач.
- Для GitHub-hosted runners локальный `.nx/cache` нужно явно переносить между runs.
- Cache key не должен включать все исходники, иначе он будет ломать переиспользование.
- `nx affected` и Nx cache дополняют друг друга, но это разные оптимизации.

## Verify

```bash
npm run format:check
npx nx reset
npx nx run api:build
npx nx run api:build
```

В GitHub Actions повторный run должен показать восстановление cache key и Nx cache replay/hit.
