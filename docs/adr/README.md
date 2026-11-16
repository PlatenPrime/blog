# Architecture Decision Records

Короткие записки о развилках: контекст, решение, отвергнутое, последствия. Через полгода «почему так» ищется здесь, а не в чатах.

**Статусы в этом репо:** `accepted` — действует; `superseded` — остаётся как история, продуктовый канон указывает на более новый ADR (обычно [ADR-007](./007-author-only-no-public-auth.md)).

## Индекс

| ADR                                                   | Статус                                                  | Тема                                              |
| ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| [000](./000-payload-next-neon-r2.md)                  | accepted                                                | Payload + Next + Neon + R2                        |
| [001](./001-migrations-policy.md)                     | accepted                                                | Миграции: push (dev) vs migrate (prod/preview/CI) |
| [002](./002-auth-verification-and-account-linking.md) | superseded → [007](./007-author-only-no-public-auth.md) | Email verify / OAuth (исторический)               |
| [003](./003-scheduled-publish-query-time.md)          | accepted                                                | Scheduled publish = query-time visibility         |
| [004](./004-public-locale-prefix.md)                  | accepted                                                | Locale prefix в публичном URL                     |
| [005](./005-i18n-fallback-and-missing.md)             | accepted                                                | i18n fallback и missing translations              |
| [006](./006-rate-limiting.md)                         | superseded → [007](./007-author-only-no-public-auth.md) | Rate limiting Upstash (исторический)              |
| [007](./007-author-only-no-public-auth.md)            | accepted                                                | Author-only: без public auth / reader layer       |
| [008](./008-sentry-waive-until-needed.md)             | accepted                                                | Sentry waived until needed                        |
| [009](./009-caching-isr-revalidate.md)                | accepted                                                | Public cache tags + on-demand revalidate          |

Следующий свободный номер: **010**.

## Практика

Пиши новый ADR, когда меняется **развилка**, а не когда обновляется список npm-скриптов:

- стек / границы deploy unit (новый сервис, второй ORM, отдельный API);
- продуктовая модель доступа (роли, публичная auth, что видит гость);
- политика данных или кэша с необратимыми последствиями;
- осознанный waive (как ADR-008) — «не делаем X, пока не Y».

Review gate шага: если архитектура или best practices сомнительны — либо исправь, либо оформи **ADR / waive**. Не оставляй решение только в чате.

**Формат (de facto):** `# ADR-NNN: …` → метаданные (Статус / Дата / шаг roadmap) → Контекст → Решение → Последствия (и «почему не …»). Язык — русский, EN-термины где принято. Не дублируй [`tech-stack.md`](../tech-stack.md): ADR отвечает на «почему выбрали / отвергли», tech-stack — на «что используем сейчас».

## Где ещё канон (не ADR)

Решения без отдельного ADR живут в канон-доках, не в чатах:

| Документ                                  | Что держит                                    |
| ----------------------------------------- | --------------------------------------------- |
| [`tech-stack.md`](../tech-stack.md)       | Что/зачем по слоям, out of scope v1           |
| [`architecture.md`](../architecture.md)   | Диаграммы и потоки запросов                   |
| [`testing.md`](../testing.md)             | Политика тестов, waivers suite                |
| [`post-v1.md`](../post-v1.md)             | Горизонт после announce (не открытые v1 todo) |
| [`content-model.md`](../content-model.md) | Коллекции и поля                              |
| [`security/`](../security/)               | Access matrix, threat model, checklist        |

Новый ADR — только при настоящей развилке; иначе достаточно правки канон-дока в том же шаге.
