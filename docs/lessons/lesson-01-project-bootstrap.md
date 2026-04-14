# Lesson 01: Project Bootstrap

## Context

Репозиторий был пустым, поэтому первым шагом создаем базовое NestJS приложение как фундамент курса.

## Concept

Bootstrap в NestJS - это инициализация приложения через `main.ts`, подключение корневого модуля и запуск HTTP сервера.

## Code Changes

- Создано приложение `app` через Nest CLI.
- Базовые файлы:
  - `app/src/main.ts`
  - `app/src/app.module.ts`
  - `app/src/app.controller.ts`
  - `app/src/app.service.ts`
- Создан тестовый каркас в `app/test`.

## Why This Matters

Без корректного bootstrap невозможно двигаться к модулям, auth и доменной логике.

## What To Remember

- Точка входа NestJS - `main.ts`.
- Приложение строится вокруг модулей.
- CLI ускоряет создание стандартизированной структуры.

## Verify

- `cd app`
- `npm run start:dev`
- Открыть `GET /` и проверить ответ.

## Homework

Измени сообщение в `AppService` и проверь, что новый текст возвращается из `GET /`.
