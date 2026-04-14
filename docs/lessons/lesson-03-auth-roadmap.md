# Lesson 03: Auth Roadmap (Users, Roles, Sessions, JWT)

## Context

Для Blog/CMS критична аутентификация и авторизация, поэтому auth-поток закладывается до доменной логики.

## Concept

Auth в NestJS строится как набор модулей: users (identity), auth (login/register), guards (access rules), sessions/tokens (state management).

## Code Changes

В auth-track будут последовательно добавлены:

1. `users` module: регистрация, поиск пользователя, hash пароля.
2. `auth` module: login/register use-cases.
3. JWT strategy + `AuthGuard`.
4. `RolesGuard` + `@Roles()` decorator.
5. Session storage для refresh-token с возможностью logout/logout-all.

## Why This Matters

Этот фундамент обеспечит безопасный доступ к приватным CMS операциям.

## What To Remember

- Authentication отвечает на "кто ты?".
- Authorization отвечает на "что тебе можно?".
- JWT удобен для stateless доступа, session полезна для контролируемого revoke.

## Verify

- Сценарий: register -> login -> protected route.
- Сценарий: user role vs admin role на одном endpoint.
- Сценарий: refresh + revoke session.

## Homework

Сравни trade-off JWT-only и JWT+sessions для мобильного и веб-клиента.
