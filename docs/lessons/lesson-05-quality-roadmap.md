# Lesson 05: Quality and Production Readiness Roadmap

## Context

Даже если auth и CMS работают, без качества сервис хрупкий: регрессии, уязвимости и сложный дебаг быстро остановят развитие проекта.

## Concept

Production readiness = четыре слоя:

1. тестируемость;
2. безопасность;
3. наблюдаемость;
4. производительность.

## Step-by-Step Implementation Plan

### Step 1 - Testing strategy

Цель: быстро ловить ошибки на разных уровнях.

- Unit: тестируем сервисы изолированно.
- Integration: тестируем модульную связку (service + repository).
- E2E: прогоняем пользовательские сценарии через HTTP.

Мини-пример unit теста:

```ts
describe('AuthService', () => {
  it('returns tokens for valid credentials', async () => {
    const result = await authService.login({ email, password });
    expect(result.accessToken).toBeDefined();
  });
});
```

### Step 2 - Security baseline

Добавляем:

- `helmet`;
- корректный `cors`;
- rate limiting (`@nestjs/throttler`);
- строгую валидацию входных DTO.

Пример цели:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

### Step 3 - Observability

Добавляем:

- структурированный логгер;
- request/correlation id;
- health endpoints (`/health`, `/ready`).

### Step 4 - Performance baseline

Добавляем:

- дефолтные лимиты пагинации;
- выборочные поля в list endpoints;
- кэширование read-heavy маршрутов.

## Why This Matters

Эти практики делают проект устойчивым: проще масштабировать, дебажить и безопасно развивать.

## What To Remember

- Без тестов невозможно безопасно рефакторить.
- Security должна быть включена по умолчанию, а не "по запросу".
- Наблюдаемость не роскошь, а инженерная необходимость.

## Verify

1. `npm run test`
2. `npm run test:e2e`
3. Проверка, что лишние поля в DTO отклоняются.
4. Проверка rate-limit и health endpoint.

## Homework

Определи минимальный набор operational метрик:

- error rate;
- p95 latency;
- auth failure rate;
- saturation (CPU/memory).
