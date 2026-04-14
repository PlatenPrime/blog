# Lesson 02: Modules and Dependency Injection

## Context

Приложение уже запускается. Теперь важно понять архитектурное ядро NestJS: модульность и DI, иначе проект быстро превратится в связанный "монолитный файл".

## Concept

`Module` организует компоненты, а DI контейнер создает `providers` и внедряет их туда, где они нужны.

Ключевая мысль урока: **контроллер не создает сервис вручную**, а получает его через constructor injection.

## Step-by-Step

### Step 1 - Понимаем роли компонентов

- `Controller` - принимает HTTP запросы;
- `Service` - содержит бизнес-логику;
- `Module` - описывает, что к чему подключено.

### Step 2 - Смотрим внедрение зависимости

```ts
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

Что здесь происходит:

- Nest видит параметр `AppService` в конструкторе;
- DI контейнер подставляет уже созданный экземпляр;
- контроллер зависит от контракта сервиса, а не от способа его создания.

### Step 3 - Почему это важно

Такой стиль:

- облегчает тестирование (можно подменять provider);
- снижает связность;
- делает расширение модулей предсказуемым.

## Code Changes In This Lesson

- Проанализирована связь `AppController -> AppService` через DI.
- Зафиксирован паттерн разделения ответственности для следующих модулей (`users`, `auth`, `posts`).

## Why This Matters

Все последующие уроки (auth, guards, data layer) опираются на корректную модульность и DI.

## What To Remember

- Module описывает composition, а не бизнес-логику.
- Provider лучше делать stateless по умолчанию.
- Constructor injection - стандарт NestJS, а не опция "по вкусу".

## Verify

1. Проследи цепочку: endpoint в контроллере -> вызов сервиса.
2. Временно добавь новый `HealthService` и внедри его в контроллер.
3. Убедись, что endpoint продолжает работать.

## Mini Practice

Создай endpoint `GET /health` и верни структуру:

```json
{ "status": "ok" }
```

через отдельный `HealthService`.

## Homework

Попробуй вынести health-логику в отдельный модуль `HealthModule` и подключить его в `AppModule`.
