# Typed Dispatch Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ввести `dispatch('namespace/ActionType', payload)` и отдельный `action.payload` любого типа.

**Architecture:** Типы аргументов выводятся из union действий. Dispatch создаёт объект `{ scope, type, payload }` и выполняет существующий цикл reducer/commit/effects. Reducers, callbacks API и описания действий эффектов используют одинаковую форму объекта.

**Tech Stack:** TypeScript 5.9.3, Vitest, Node 26, Svelte 5, ESLint, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-dispatch-path-design.md`.

## Global Constraints

- Payload может иметь любой тип, определённый конкретным действием.
- Namespace, имя действия и payload связаны типами; дополнительный ручной реестр не требуется.
- Reducer читает данные из `action.payload`.
- Порядок обновления state, ожидание эффектов и вложенных dispatch, обработка ошибок сохраняют текущую семантику.
- Следовать AGENTS.md; публичные типы — каждый в отдельном файле; common не зависит от Svelte.
- Реализация выполняется в текущей ветке; коммиты с `[gost-kit-44]`.
- Предложения дизайна про root-путь, замену объектного вызова и runtime-проверку пути согласовать при рассмотрении плана до изменения кода.

## Review Focus

- Примитивы, массивы и null доходят до reducer без преобразования — Task 2.
- Путь-union не допускает неподходящий payload — Task 1.
- Отсутствующий payload отличается от обязательного значения undefined — Tasks 1–2.
- API callbacks и вложенные эффекты используют новый контракт, сохраняя ожидание и однократный reporting — Task 2.
- Typed ESLint recognition продолжает отличать настоящий dispatch от одноимённых функций — Task 3.

---

### Task 1: Типизированные аргументы dispatch

**Files:**
- Create: `packages/common/src/fc/types/dispatch-path.ts`, `dispatch-arguments.ts`, `dispatch.test.ts`.
- Modify: `packages/common/src/fc/types/dispatch.ts`, `dispatch-action.ts`, `scoped-actions.ts`, `packages/common/src/fc/index.ts`.

**Interfaces:**
- Consumes: union действий `{ type; payload? }` и существующий `ScopedActions`.
- Produces: `DispatchPath<TAction>`, `DispatchArguments<TAction>` и `Dispatch<TAction> = (...args: DispatchArguments<TAction>) => Promise<void>`.

- [x] Написать compile-time тесты: объект, number, string, boolean, null, массив, union payload; действие без данных; optional payload; объект с optional-полями; обязательный undefined. Проверить неизвестный namespace/action, пропущенные обязательные данные, лишний аргумент и неправильный тип через `@ts-expect-error`. Для `path: 'users/SetPageAction' | 'users/LoadAction'` вызов с `2` должен отклоняться.
- [x] Запустить `npm run check --workspace @gost-kit/common`; подтвердить ошибки текущего контракта.
- [x] Реализовать коррелированный union кортежей аргументов. Служебный Trigger не менять для эффектов; данные действий явно объявляются как payload. Вывести путь без повторного Extract по всем действиям.
- [x] Согласованно перевести объявления действий и их чтения в тестах common на payload; повторно проверить типы common и compile-эксперимент с 2000 действиями/100 namespace. Ожидается отсутствие неожиданных diagnostic и срабатывание всех отрицательных тестов.
- [x] Закоммитить типы и миграцию тестовых деклараций: `[gost-kit-44] Define typed dispatch paths and payload arguments`.

### Task 2: Исполнение dispatch и эффекты

**Files:**
- Modify: `packages/common/src/fc/lib/dispatch.ts`, `dispatch.test.ts`, `create-api-effector.ts`, `create-api-effector.operations.test.ts`, `create-api-effector.test.ts`.
- Modify: `packages/common/src/fc/types/store-error.ts`, `api-effect-actions.test.ts`, затронутые FC-тесты common.
- Create: `packages/common/src/fc/lib/forward-action.ts`, `forward-action.test.ts`, `types/dispatch-error.ts`.

**Interfaces:**
- Consumes: Task 1 `Dispatch<TAction>`, `DispatchArguments<TAction>`.
- Produces: прежний `createDispatch(config): Dispatch<TAction>` с новым вызовом; внутренний `forwardAction<TAction>(dispatch: Dispatch<TAction>, action: DispatchAction<TAction>): Promise<void>` для результата API callbacks.

- [x] Написать RED-тесты точного объекта на входе reducer: `dispatch('users/SetPageAction', 2)` → `{scope:'users', type:'SetPageAction', payload:2}`; для объекта/массива проверить сохранение ссылки; для null — точного значения; без второго аргумента — отсутствие поля payload, с явным undefined — присутствие поля.
- [x] Добавить runtime-тесты root/feature routing, нескольких быстрых dispatch, API success/error callbacks и вложенных dispatch с прежней семантикой ожидания и reporting. Для неверного формата пути проверить один TypeError в reporter и отсутствие readState/reducer/writeState/effects.
- [x] Запустить `npm test --workspace @gost-kit/common`; подтвердить RED новых сценариев.
- [x] Обновить dispatch: разделить путь, собрать объект с отдельным payload, затем использовать существующее исполнение. Для ошибки формата ввести `DispatchError = { kind: 'dispatch'; path: unknown; error: TypeError }` в StoreError, сохранив разрешённый Promise. Проверка формата требует ровно один `/` и непустые части. Поведение reducer для неизвестного действия не расширять в этой задаче при принятии предложенной границы.
- [x] В API adapter направлять возвращённые callbacks объекты через внутренний forwardAction; сохранить их payload и обработку ошибок. Type erasure, если потребуется при динамической передаче union, ограничить этим адаптером и покрыть type tests публичного API.
- [x] Запустить `npm run check --workspace @gost-kit/common` и `npm test --workspace @gost-kit/common`; ожидать PASS всех контрактных тестов, включая reset и dispatch errors.
- [x] Закоммитить: `[gost-kit-44] Execute namespaced dispatch with separate payload`.

### Task 3: Svelte и правила ESLint

**Files:**
- Modify: `packages/svelte/src/shell/domain/createStore.test.ts`, `packages/eslint-plugin/src/lib/dispatch-type.ts`, `packages/eslint-plugin/src/rules/single-intent-dispatch.test.ts`.
- Check: `packages/svelte/src/shell/domain/createStore.svelte.ts`, `packages/eslint-plugin/src/rules/single-intent-dispatch.ts`.

**Interfaces:**
- Consumes: новый `Dispatch<TAction>` из common.
- Produces: Store.dispatch с тем же новым контрактом; прежнее распознавание genuine dispatch в ESLint.

- [x] Добавить/мигрировать Svelte tests: dispatch(path, payload) обновляет наблюдаемое state, независимые stores и reset сохраняют поведение.
- [x] Добавить ESLint fixtures: один `dispatch('users/LoadAction')` и один `dispatch('users/SetPageAction', 2)` валидны; условный выбор действия и несколько dispatch по-прежнему запрещены. Одноимённая посторонняя функция не считается dispatch.
- [x] Запустить тесты Svelte/plugin; проверить RED новых контрактов там, где текущая реализация распознаёт старую сигнатуру.
- [x] Адаптировать recognition только при подтверждённой необходимости. Сохранить границу UI-Kit и бизнес-компонентов; настройки severity не менять.
- [x] Запустить `npm run check --workspace @gost-kit/svelte`, `npm test --workspace @gost-kit/svelte`, `npm test --workspace @gost-kit/eslint-plugin` — PASS.
- [x] Закоммитить: `[gost-kit-44] Integrate dispatch paths with Svelte and lint checks`.

### Task 4: Сквозной пример и поставка

**Files:**
- Modify: `examples/functional-core/src/features/user/domain/fc/action.ts`, `reducer.ts`, `reducer.test.ts`.
- Modify: `examples/functional-core/src/store/fc/reducer.ts`, `effector.ts`, `examples/functional-core/src/store/types/action.ts` и затронутые tests/components/presenters примера.
- Modify: `packages/common/README.md`, `packages/svelte/README.md`, `examples/functional-core/README.md`, затронутая документация ESLint.
- Create: `.changeset/typed-dispatch-path.md`.

**Interfaces:**
- Consumes: Tasks 1–3 API и типы.
- Produces: полностью мигрированный пример, публичная документация и changeset.

- [x] Перевести примеры деклараций на payload, reducer — на action.payload, компоненты и эффект глобального уведомления — на вызов path/payload. Проверить unit-тестами точные commits и error context, не ослабляя assertions ради миграции.
- [x] Обновить README с примерами: без payload, primitive, array, object и вызов из эффекта; описать breaking migration и выбранный root-синтаксис.
- [x] Добавить changeset common и Svelte; ESLint plugin/configs добавить только при изменениях поставляемого поведения/зависимостей согласно правилам версионирования репозитория.
- [x] Выполнить `npm run check`, затем в example `npm run build` и `npm run test:e2e -- --workers=1`. Ожидается PASS, отсутствие Svelte errors/warnings, сохранение двух текущих browser flows.
- [x] Проверить реальные tarballs common/Svelte в disposable consumer: typed path/payload и API effector доступны через публичные exports; тесты отсутствуют в поставке. Прогнать `git diff --check`.
- [x] Закоммитить: `[gost-kit-44] Migrate example and document dispatch payload API`.
- [ ] Провести одно независимое ревью всей ветки; исправить подтверждённые дефекты и повторить затронутые проверки. PR/merge/publication — по дальнейшему указанию владельца.
