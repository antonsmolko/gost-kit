# Presenter Computations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Реализовать opt-in gost/require-presenter и сохранить selector checks в @const (#19).

**Architecture:** Общий классификатор ready expressions, lazy TypeScript resolver
presenter declarations и контекстные Svelte listeners. #6 использует свой
существующий Store/raw provenance; расширяется только область вызовов @const.

**Tech Stack:** Node 26, TypeScript 5.9.3, Svelte 5.57.2,
svelte-eslint-parser 1.10.1, typescript-eslint 8.72.1, ESLint 10.14.0.

**Spec:** [Утверждённый дизайн](../specs/2026-11-08-presenter-computations-design.md).

## Global Constraints

- Presenter source *.presenter.ts, emitted API *.presenter.d.ts; aliases/barrels supported.
- Не доказывать purity, не обходить public API, не распознавать presenter только по имени.
- Read/literal/containers и TS wrappers проверяются рекурсивно; никаких auto-generated presenters/fixes.
- One diagnostic per derived/const root; template display calls запрещены, render outer call разрешён.
- Сохраняются event/lifecycle/await-source exclusions и #18 if responsibility; descendants проверяются.
- Common/Svelte runtime не меняются; plugin minor + config-svelte patch.
- Работать в текущей issue feature branch; коммиты [gost-kit-19].

## Review Focus

- Aliases with Fn annotations/reexport chains сохраняют declaration provenance (Task 1).
- Nested calculations внутри containers/type wrappers и mutable presenter aliases не обходят checks (Task 1).
- Snippet/await/head/dynamic-element descendants и snippet defaults не пропускаются (Task 2).
- @const с direct Store/raw call получает #6 без template autofix, deferred callbacks не считаются immediate (Task 2).
- Packaged declarations и реальный consumer с exported barrel работают без GOST runtime dependency (Task 3).

### Task 1: Presenter resolution and derived expressions

**Files:** create `packages/eslint-plugin/src/lib/presenter-call.ts`, `ready-value.ts`,
`derived-value.ts`; create `rules/require-presenter.ts`, colocated
`require-presenter.test.ts` and test-only fixtures helper as needed;
modify `packages/eslint-plugin/src/index.ts`.

**Interfaces:** `createPresenterCallCheck(services)` returns `(call: TSESTree.CallExpression) => boolean`;
`readyValue(expression, isPresenterCall?) => boolean` allows calls only through
supplied predicate; `derivedValue(callback, isReady) => boolean` validates inline
sync callback, const-only declarations/destructuring and single terminal return.
Rule exposes messageId `requirePresenter`; no options/fixer.

- [x] Write compiler-validated fixtures: ready values/containers/optional/dynamic
  reads, present calls/import aliases/default/namespace/barrels/declaration API,
  immutable vs reassigned aliases, no name-based exceptions, Fn annotation.
- [x] Add invalid arithmetic/logical/call/new/await/functions, nested calculations,
  wrapper/argument cases, derived.by branching/mutation, shadowed intrinsic cases.
  Configuration error is tested separately from ordinary rule diagnostics.
- [x] Run plugin test for require-presenter. Expected RED: rule absent.
- [x] Implement resolver with per-file symbol cache/cycle guard, structural ready
  values and derived callbacks; register rule export. Resolve actual bindings,
  not function type signatures that lose source under Fn annotations.
- [x] Run plugin tests + typecheck; format/lint touched code. Expected GREEN.
- [x] Commit `[gost-kit-19] Require presenter computations in derived bindings`.

### Task 2: Template contexts and const selectors

**Files:** extend `rules/require-presenter.ts` and tests; create focused
`lib/template-expression.ts` if rule needs context adapter; modify
`lib/reactive-context.ts`, `rules/require-feature-state-selector.ts`, and add
colocated template/selector integration tests (shared test helper from Task 1).

**Interfaces:** Task 1 readyValue without call predicate checks display slots;
with presenter predicate checks @const/default bindings. reactiveContext returns
discriminated `kind: 'derived' | 'templateConst'`; only derived branch has
`derived` for selectorFix. Template branch produces diagnostic only.

- [x] Write RED fixtures for every design table row: text/raw/props/style/class/
  spread, each source/key, key block, @const row presenter, render callee/args,
  snippet body/defaults, pending/then/catch, head/this/descendants. Pin exclusions
  for event/bind/actions/transitions/attachments/await source/if conditions.
- [x] Write combined #6+#19 tests: direct root/raw call in @const reports selector,
  separate local selector/row inputs valid, multi-scope call reports correctly,
  deferred functions exempt; #6 works without #19. Existing derived fixes unchanged.
- [x] Run these tests before implementation. Expected RED: missing listeners/selector.
- [x] Implement slot listeners with recursive normal traversal and no parent-block
  exclusions. Skip nested duplicate derived roots, event attrs; @render checks
  only outer call callee and ready arguments. Validate snippet/default patterns.
- [x] Extend #6 script filter/reactive context and diagnostic message for @const;
  no template autofix, retain previous TS scope and Store/raw checks.
- [x] Run complete plugin tests/check/lint. Expected GREEN including old fixes.
- [x] Commit `[gost-kit-19] Check template computations and const state selectors`.

### Task 3: Consumer configuration, documentation and delivery

**Files:** Svelte config `src/create-svelte-config.ts` and tests;
`tooling/eslint-config.ts`, `tooling/eslint-config.test.ts`;
plugin RULES/README, config README, `.changeset/presenter-computations.md`;
design/plan completion notes.

**Interfaces:** Public config registers gost/require-presenter off; project adapter
enables for src/**/*.svelte. UI-Kit late override off stays possible.

- [x] Add RED config tests: off/on/UI-Kit off, existing policies unchanged,
  actual diagnostics for calculations and no errors for example-ready bindings.
- [x] Wire config + documentation: exact slots, module naming/declarations,
  #6 @const coverage/TS boundary, parser requirement and limitations, no autofix.
- [x] Add changeset plugin minor + config-svelte patch.
- [x] Run full root check, example build and 2 browser scenarios. Expected GREEN.
  Svelte autofixer only if components/rune modules changed.
- [x] Build/pack plugin/config; real external consumer with TS program/barrels
  validates published API boundary, source declarations, rule diagnostics and
  unchanged dependency/artifact boundaries. Expected GREEN.
- [x] Commit `[gost-kit-19] Configure and document presenter enforcement`.
- [x] One fresh whole-branch review; important findings one RED→GREEN fix pass.
  Prepare draft PR with evidence; do not merge/publish without owner instruction.
