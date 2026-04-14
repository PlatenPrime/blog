# Lesson 05: Quality and Production Readiness Roadmap

## Context

Функциональность без качества не готова к реальной эксплуатации.

## Concept

Quality track объединяет тестируемость, безопасность, наблюдаемость и производительность.

## Code Changes

Запланированы улучшения:

- Тесты:
  - unit для сервисов;
  - integration для модульных сценариев;
  - e2e для auth/cms happy-path и edge cases.
- Security:
  - `helmet`, `cors`, `throttler`, строгая валидация входа;
  - минимизация утечек данных в ошибках.
- Observability:
  - структурированный логгер;
  - correlation/request ID;
  - healthchecks.
- Performance:
  - pagination defaults;
  - selective fields;
  - cache для read-heavy endpoints.

## Why This Matters

Качество - это не "после", а часть архитектуры API.

## What To Remember

- Тесты фиксируют поведение и защищают от регрессий.
- Безопасность должна быть defense-in-depth.
- Наблюдаемость нужна для дебага и эксплуатации.

## Verify

- `npm run test`
- `npm run test:e2e`
- Проверка rate-limit и health endpoint.

## Homework

Опиши минимальный SLO для API и какие метрики нужны для его контроля.
