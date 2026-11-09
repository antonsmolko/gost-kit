# Package descriptions and README editing (#31)

## Intent

Новый потребитель npm должен быстро понять назначение пакета, установить его и
запустить минимальный пример. Переписать description и README шести пакетов,
без изменения runtime, публичного API или lint policy.

## Agreed language and tone

Владелец выбрал английский, коротко и по делу. Порядок: назначение → установка →
законченный пример → подробности. Без рекламных обещаний, истории issues/PR и
внутренних source/build деталей в пользовательском quick start.

## Approach

Сохранить справку после quick start внутри README, а для правил линтера ссылаться
на уже поставляемые RULES.md. Так важные контракты останутся доступны, а отдельная
иерархия новых документов не потребуется. Простая правка первых абзацев оставила
бы перегруженную структуру; перенос всей справки в новые файлы добавил бы
изменения упаковки без необходимости. Выбор способа размещения справки —
предложение автора, язык и порядок согласованы владельцем.

## Example of tone

Для @gost-kit/svelte:

> Reactive state for Svelte 5, driven by reducers and effects.
> Keep state transitions in TypeScript and read the current state from Svelte components.

Затем явная команда установки и самостоятельный пример createStore с фабрикой
initial state, типом action, чистым reducer, пустым effector, dispatch и reset.
После примера — ограничения immutable/raw state, factory freshness, selector
references, reset/error semantics и необходимость Svelte compilation.

## Scope

- common: types/guards, framework-independent reducers/effects и typed API client;
  сохранить важные ограничения errors, JSON parsing, mapping, dispatch и reset.
- svelte: createStore, реактивное чтение и подключение common; не обещать работу
  rune-кода без Svelte compilation.
- eslint-config: установка, typed flat config и tsconfig, окружения и RULES.
- eslint-config-svelte: полный JS/TS baseline, Svelte parser и opt-in GOST policies.
- eslint-plugin: публичный plugin export, parser setup, пять правил и их границы;
  минимальный пример должен работать без неуказанных parser services.
- prettier-config: установка, экспорт config, команды check/write и overrides.

Подробности независимого версионирования/разработки монорепозитория не должны
предшествовать подключению. Не копировать номера issues в npm-справку. Относительные
ссылки должны разрешаться из реального tarball; ссылки на исходники примера —
явные GitHub URLs. Установленные package/peer names и поддерживаемые версии сверить
с manifests. Не добавлять неподтверждённые гарантии.

## Verification and delivery

Проверить код примеров против текущих exports: TypeScript, ESLint/Prettier config
loading и Svelte compilation по необходимости. Проверить ссылки и содержимое
реальных tarballs всех шести пакетов. Запустить format check и существующие
проверки, соответствующие изменённым snippets. Новые implementation-mirroring
тесты и runtime изменения не нужны. Добавить patch changeset для описаний всех
шести пакетов: npm-страницы обновятся только при публикации следующих версий.

Работать в issue feature branch; коммиты [gost-kit-31], отдельный PR.
Merge и публикация выполняются по отдельному указанию владельца.

## Status

Язык и тон согласованы. Короткий дизайн подготовлен для утверждения перед
массовой редактурой; package README/description ещё не изменены.
