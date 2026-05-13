# Release Policy

## Purpose / Назначение

Define a minimal and predictable release workflow for this repository.
Зафиксировать минимальный и предсказуемый процесс релизов для репозитория.

## Versioning / Версионирование

- Use Semantic Versioning: `MAJOR.MINOR.PATCH`.
- Используем Semantic Versioning: `MAJOR.MINOR.PATCH`.
- Git tag format is always `vMAJOR.MINOR.PATCH`.
- Формат git-тега всегда `vMAJOR.MINOR.PATCH`.

## Changelog Rules / Правила changelog

- `CHANGELOG.md` is required for each release.
- `CHANGELOG.md` обязателен для каждого релиза.
- Keep `## [Unreleased]` as the top active section.
- Секция `## [Unreleased]` всегда остается верхней активной секцией.
- Before tagging, move relevant items from `Unreleased` to a versioned section.
- Перед тегированием переносим релевантные пункты из `Unreleased` в секцию версии.
- Prefer grouped sections: `Added`, `Changed`, `Fixed`, `Removed`, `Security`.
- Предпочтительные группы: `Added`, `Changed`, `Fixed`, `Removed`, `Security`.

## Release Checklist / Чеклист релиза

1. Ensure default quality gates are green (`build`, `test`, `lint` as applicable).
2. Обновить `CHANGELOG.md` и проверить полноту заметок.
3. Decide target version using semantic versioning rules.
4. Создать annotated git tag (`git tag -a vX.Y.Z -m "Release vX.Y.Z"`).
5. Push tag to remote (`git push origin vX.Y.Z`).
6. Verify docs references if release process or policy changed.

## Out of Scope / Не входит в шаг

- No automatic release creation in CI.
- Без автогенерации release notes.
- Без auto version bump tooling (`changesets`, `semantic-release`).

## References / Ссылки

- [CHANGELOG.md](../CHANGELOG.md)
- [development-roadmap.md](./development-roadmap.md)
- [lesson-024-release-stub-and-changelog-policy.md](./lessons/lesson-024-release-stub-and-changelog-policy.md)
