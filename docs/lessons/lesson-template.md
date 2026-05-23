# Lesson NNN: <Topic>

> Замените `NNN` на трёхзначный номер шага из [`development-roadmap.md`](../development-roadmap.md).

## Learning Goal

Что изучаем в этом шаге и какую задачу разработки закрываем.

## Implementation Scope

Чёткие границы: что входит в шаг, что намеренно **не** делаем (отложено на следующие NNN+1).

## Dependencies

Пакеты, версии Node, внешние сервисы (Docker, БД), переменные окружения.

## External operations (outside the repo)

Что нужно сделать **вне** IDE: Docker, dashboard облака, DNS, аккаунты. Если ничего — напишите явно.

| Action                     | Where (tool / URL)                                        | Required this step?       | Why in the architecture                   |
| -------------------------- | --------------------------------------------------------- | ------------------------- | ----------------------------------------- |
| _(example)_ Start Postgres | `docker compose up -d` — [LOCAL_SETUP](../LOCAL_SETUP.md) | Yes                       | API talks to DB in container, not on host |
| _(example)_ Vercel project | vercel.com                                                | No — deferred to step NNN | SSR deploy comes later                    |

**Architecture sketch:** 3–6 sentences — laptop vs Docker vs future cloud (Railway / Vercel / Supabase only if relevant). What trust boundary we cross (browser → web → api → db).

**Deferred:** list cloud/SaaS work with future roadmap step numbers so the reader does not sign up prematurely.

## Step-by-Step Changes

1. Шаг с ожидаемым результатом.
2. …

## Code Example

Минимальный фрагмент кода или команд, иллюстрирующий идею (при необходимости).

## Context

Что уже сделано до этого урока и какую проблему решаем сейчас.

## Concept

Короткое объяснение одного ключевого понятия урока.

## Code Changes

- Файл 1: что добавлено/изменено.
- Файл 2: зачем это нужно.

## Why This Matters

Как эта концепция помогает строить надежный и расширяемый продукт (API + web).

## Architecture Notes

Принятые решения, альтернативы, trade-offs, ссылки на ADR (если есть).

## Changed Files

| Файл           | Действие (создан / изменён / удалён) |
| -------------- | ------------------------------------ |
| `path/to/file` | кратко зачем                         |

## Verification

- Команда 1 + ожидаемый результат.
- Команда 2 + ожидаемый результат.
- HTTP / e2e сценарий (если применимо).

## TDD Sequence

При применимости (когда есть проверяемое поведение/контракт):

- Red: добавить/обновить тест (ожидаемо падающий/красный сценарий).
- Green: написать минимальный код, чтобы тест стал зелёным.
- Refactor: привести код в порядок без изменения поведения (опционально, но желательно).

## Definition of Done

- [ ] Критерий 1 (измеримый).
- [ ] Критерий 2.
- [ ] Критерий 3.
- [ ] **External operations** заполнены; LOCAL_SETUP обновлён, если новые порты/сервисы.

## What To Remember

- Ключевая мысль 1.
- Ключевая мысль 2.
- Ключевая мысль 3.

## Verify

Краткая выжимка команд для быстрого прогона (дубли допустимы с **Verification**).
