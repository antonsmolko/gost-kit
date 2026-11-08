# Store reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Добавить reset с исключениями и фабричную инициализацию store (#32).

**Architecture:** Common выполняет reset через injected readState/writeState.
Svelte связывает его с одним $state.raw; root factory композирует scope factories.

**Tech Stack:** TypeScript 5.9.3, Svelte 5.57.2, Vitest 5, Node 26.

**Spec:** [Утверждённый дизайн](../specs/2026-11-08-store-reset-design.md).

## Global Constraints

- initState вызывается без аргументов; готовые значения больше не принимаются.
- excluded — readonly root keys; partial reset только для фиксированного record.
- Ключ существует в current И fresh; иначе TypeError до writeState.
- Один writeState, отсутствие мутаций; исключённые ссылки сохраняются.
- Нет отмены эффектов, router/persistence API, deep clone или legacy config.
- Публичные типы по одному на файл, common без Svelte, тесты рядом с кодом.

## Review Focus

- Union root с общим discriminator: исключения запрещены типами (Task 1).
- Optional scope отсутствует с одной стороны: TypeError без записи (Task 1).
- __proto__/numeric/symbol own keys: сохранение значений без изменения prototype (Task 1).
- Замена config.initState после создания: snapshot factory остаётся прежней (Task 2).
- Эффект завершается после reset: dispatch видит текущее состояние (Task 2).

### Task 1: Framework-independent reset

**Files:** create `packages/common/src/fc/lib/create-reset.ts` и colocated test;
create `types/reset.ts`, `types/reset-options.ts`, `types/reset-config.ts`;
modify `packages/common/src/fc/index.ts`.

**Interfaces:** Produces `createReset<TState>(config: ResetConfig<TState>): Reset<TState>`;
ResetConfig содержит initState: AnyFn<[], TState>, readState: AnyFn<[], TState>,
writeState: AnyFn<[state: TState], void>. Reset = (options?: ResetOptions<TState>) => void.
ResetOptions содержит excluded?: readonly keys[], union/primitive/array/function
дают never keys. IsUnion приватный; проверка true extends IsUnion<TState>.

- [x] Добавить runtime tests: полный/повторный/пустой reset, несколько исключений,
  все scopes, дубли, свежие вложения, overrides и неизменность объектов; failure
  factory/readState/validation не вызывает writeState. Counter проверяет вызовы
  без аргументов; createReset сам factory не вызывает.
- [x] Добавить tests для optional/временных/унаследованных/неизвестных keys,
  `__proto__`, numeric/symbol; полный reset primitive/array и runtime bypass
  непустого excluded. Type assertions: union discriminator/variant keys rejected,
  nested union accepted, readonly keys accepted, unknown keys rejected.
- [x] Run `npm test --workspace @gost-kit/common -- create-reset.test.ts`.
  Expected: RED — createReset отсутствует.
- [x] Реализовать API/exports; partial result — shallow copy fresh с собственными
  data properties исключений; не использовать присваивание __proto__.
- [x] Run common test + check. Expected: GREEN.
- [x] Commit `[gost-kit-32] Add framework-independent store reset`.

### Task 2: Store factory integration

**Files:** modify common `types/store.ts`, `types/store-config.ts`,
`lib/dispatch.test.ts`; Svelte `shell/domain/createStore.svelte.ts`,
`createStore.test.ts`; example `store/root.ts`, `store/fc/state.ts`;
create colocated example `store/fc/state.test.ts` if needed for overrides.

**Interfaces:** Consumes Task 1 createReset. Produces Store.reset, factory-only
StoreConfig.initState, createStore(config) with stable dispatch/reset methods.
Example initialState = define.state<RootState>((options = {}) => ...).

- [x] Добавить Svelte tests: factory once on creation/once per reset/no args,
  independent stores, full reset primitive/array, mixed scopes reactive snapshot,
  preserved presenter/reference, stable store/dispatch, dispatch after reset,
  pending effect dispatch after reset и snapshot config factory.
- [x] Добавить StoreConfig compile-time test: object initState rejected, required
  factory options rejected, optional overrides/inference accepted.
- [x] Run Svelte tests. Expected: RED — нет reset/factory support.
- [x] Подключить createReset с общими read/write closures, мигрировать common
  test-store и все initState call sites. Test-store использует настоящий createReset.
- [x] Добавить example test `initialState({ user: userState({ errors: [...] }) })`
  с реальной фабрикой AppError; fresh default nested data и переданные ссылки.
- [x] Build common, run common/Svelte/example checks and tests.
  Expected: GREEN; существующий dispatch contract сохранён.
- [x] Commit `[gost-kit-32] Integrate reset and scope state factories`.

### Task 3: Documentation and distribution

**Files:** common/Svelte README, `packages/svelte/docs/createStore.spec.md`,
example docs при наличии initState snippets; `.changeset/store-reset.md`.

**Interfaces:** Consumes factory Store API; produces documented installation
contract and changeset common minor + Svelte minor (breaking 0.x API).

- [x] Обновить docs: factory composition/overrides, reset API, excluded own keys,
  strict missing keys, union boundary, factory freshness responsibility, pending
  effects, snapshot config. Исправить все старые value initState snippets.
- [x] Run root `npm run check`, example build + `test:e2e`, Svelte autofixer.
  Expected: GREEN/no rune issues. Доказательства сохранять в plan scratch.
- [x] Pack common/Svelte; установить реальные tarballs вне repo. Проверить exported
  reset types/invalid keys strict tsc, runtime createReset и скомпилированный Svelte
  createStore reset; tests/src отсутствуют, common не зависит от Svelte.
- [x] Commit `[gost-kit-32] Document reset contract and prepare package changes`.
- [x] Один независимый whole-branch review; доказанные важные findings исправить
  RED→GREEN. Подготовить draft PR с доказательствами, merge/publish не выполнять.
