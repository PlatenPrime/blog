# Runbook: Vercel Logs

Шаг **098**. Runtime-логи Production/Preview без тяжёлого стека (Sentry — **099**). Connect / Preview / Analytics — [vercel-connect.md](./vercel-connect.md), [vercel-preview.md](./vercel-preview.md), [vercel-analytics.md](./vercel-analytics.md).

## Что подключено

| Элемент       | Где                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| App logger    | [`src/lib/logger.ts`](../../src/lib/logger.ts) — JSON-строка в `console.info` / `warn` / `error`              |
| Request id    | `getRequestId(headers)`: `x-request-id` → `x-vercel-id` → `crypto.randomUUID()`                               |
| Probe surface | Draft preview: [`src/app/(frontend)/next/preview/route.ts`](<../../src/app/(frontend)/next/preview/route.ts>) |
| CLI failures  | `seed:admin`, `backfill:search-text` — тот же JSON на stderr                                                  |

Формат одной строки (пример):

```json
{
  "level": "error",
  "msg": "Error verifying token for draft preview",
  "time": "2026-11-16T08:00:00.000Z",
  "requestId": "…",
  "err": { "name": "Error", "message": "…", "stack": "…" }
}
```

Client `error.tsx` / `global-error.tsx` пишут в **браузерный** console — в Vercel Logs их нет. Для диагностики сервера смотри JSON от `logger`.

## Куда смотреть в Vercel UI

1. Vercel → Project `blog` → **Logs** (или Deployment → **Logs** / **Runtime Logs**).
2. Выбери окружение: **Production** или **Preview** (и нужный deployment, если смотришь PR).
3. Фильтруй по времени вокруг воспроизведения; ищи подстроку `Error verifying token for draft preview` или `"level":"error"`.
4. Строка logger — одна JSON-запись; `requestId` сверь с заголовком ответа / `x-vercel-id`, если нужно связать несколько событий.

CLI (опционально, если установлен `vercel`): `vercel logs` для текущего linked project — те же runtime lines.

## Локальная проверка (probe)

1. `npm run dev`.
2. Открой `/next/preview` с валидным `previewSecret` / `path` / `collection` / `slug`, но **без** admin-сессии (инкогнито) **или** временно сломай cookie так, чтобы `payload.auth` бросил — в catch уйдёт `logger.error`.
3. В терминале `dev` должна появиться JSON-строка с `msg` = `Error verifying token for draft preview` и полем `requestId`.
4. Unit: `npm test -- tests/unit/logger.test.ts`.

На Preview/Production после деплоя шага **098** тот же JSON виден в Runtime Logs при failed preview auth.

## Связанные документы

- [tech-stack.md](../tech-stack.md) §11 Observability
- [LOCAL_SETUP.md](../LOCAL_SETUP.md)
- Preview paths: [`src/preview/paths.ts`](../../src/preview/paths.ts)
