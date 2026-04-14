# Lesson 01: Project Bootstrap

## Context

Мы стартуем с нуля. Цель урока - понять, как NestJS приложение поднимается от команды CLI до первого работающего HTTP endpoint.

## Concept

Bootstrap в NestJS - это процесс инициализации приложения в `main.ts`:

1. создается экземпляр приложения на основе root module;
2. подключаются глобальные настройки (будет в следующих уроках);
3. запускается HTTP сервер.

## Step-by-Step

### Step 1 - Создаем проект

```bash
npx @nestjs/cli@latest new app --package-manager npm --skip-git
```

Что важно:

- CLI сразу создает production-friendly структуру;
- внутри уже есть тестовый контур и TypeScript конфигурация.

### Step 2 - Смотрим entrypoint `main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Разбор:

- `NestFactory.create(AppModule)` - поднимает DI контейнер и root module;
- `listen(...)` - открывает HTTP порт;
- `bootstrap()` - традиционное имя функции запуска.

### Step 3 - Проверяем root module

```ts
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

`AppModule` - точка сборки компонентов приложения.

## Code Changes In This Lesson

- Создано приложение в `app/`.
- Добавлены стартовые файлы `main.ts`, `AppModule`, `AppController`, `AppService`.
- Подготовлен базовый e2e тест в `app/test`.

## Why This Matters

Без понимания bootstrap сложно осознанно подключать middleware, validation, security и модули домена дальше по курсу.

## What To Remember

- Entry point NestJS - `main.ts`.
- Приложение стартует от root module.
- CLI создает хороший baseline, который лучше не ломать ранним рефакторингом.

## Verify

```bash
cd app
npm run start:dev
```

Проверка:

- открыть `GET http://localhost:3000/`;
- убедиться, что приходит ответ из `AppService`.

## Mini Practice

1. Измени строку в `AppService`.
2. Перезапусти `start:dev`.
3. Убедись, что `GET /` возвращает новый текст.

## Homework

Добавь переменную окружения `PORT=4000` и проверь запуск на новом порту.
