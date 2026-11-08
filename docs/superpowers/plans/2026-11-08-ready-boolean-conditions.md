# Ready Boolean Conditions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task, with one whole-branch review.

**Goal:** Проверять готовые boolean-условия Svelte templates без запрета условной разметки.

**Architecture:** В opt-in ESLint rule синтаксический whitelist отделяет чтение от вычисления, TypeScript checker доказывает boolean. Presenter готовит флаги примера, опубликованный config оставляет правило off, проект включает его явно.

**Tech Stack:** Node 26, TypeScript 5.9.3, ESLint 10.14.0, typescript-eslint 8.72.1, svelte-eslint-parser 1.10.1, Svelte 5.57.2, Vitest.

**Spec:** [Утверждённый дизайн #18](../specs/2026-11-07-ready-boolean-conditions-design.md).

## Global Constraints

- Только SvelteIfBlock, включая else-if, вложенные each/await/snippet. Boolean literals разрешены.
- Identifier/static member chains разрешены только с boolean type. Reject any/unknown/never/nullable и вычисления/assertions/dynamic keys.
- Generic boolean constraint разрешён. Нужны настоящие type services и strictNullChecks для чтений; отсутствие — configuration error. Literal/invalid syntax не требуют checker.
- Правило default off; явное project включение, UI-Kit может выключить override. Без autofix/suggestions, без нового пакета или architecture mode.
- Не меняем бизнес-state/dispatch/DOM-поведение. Проверка не доказывает presenter provenance. Остальные template computations — #19.
- Presenter named parameters, explicit result types, чистые функции; выбранный state и вызов presenter в отдельных $derived.

## Review Focus

- TS boolean type parameters/aliases и never/any: не принимать ложное доказательство типа.
- Optional chains/static brackets: проверять тип целого выражения, включая undefined.
- Svelte each/await/snippet scopes и shadowed names: checker mapping соответствует template месту.
- JS/stateless и отсутствие services/strict null checking: не проходить молча.
- Packed plugin/config: новое правило доступно без workspace исходников и остаётся выключенным по умолчанию.

### Task 1: Rule, syntax and type contract

**Files:** Create `packages/eslint-plugin/src/rules/ready-boolean-condition.ts` and colocated test; helpers `src/lib/ready-boolean-expression.ts`, `src/lib/boolean-type.ts` if useful. Modify plugin `src/index.ts`.

**Interfaces:** Export `readyBooleanCondition` RuleModule with no options, messageId `readyBoolean`; exported plugin rule `ready-boolean-condition`.

- [x] Написать compiler-validated fixtures и RuleTester tests: literal/identifier/member/alias/static keys/nullable optional chains, mixed types, TS generics, script-if exclusions, one diagnostic per invalid condition.
- [x] Запустить `npm test --workspace @gost-kit/eslint-plugin -- --run src/rules/ready-boolean-condition.test.ts`. Expected: FAIL, rule missing.
- [x] Реализовать whitelist выражений и lazy parser services. Boolean predicate использует checker constraints, unions и TypeFlags, не type-name strings. Для strictNullChecks использовать resolved compiler option с учётом strict override.
- [x] Добавить configuration-error tests для reads без services/strict null; JS/stateless/context mapping cases. Запустить rule tests и plugin tsc. Expected: PASS, все negative fixtures дают rule diagnostic, а не compiler error.
- [x] Проверить plugin lint/format, commit `[gost-kit-18] feat: require ready boolean template conditions`.

### Task 2: Presenters and opt-in config

**Files:** Modify `packages/eslint-config-svelte/src/create-svelte-config.ts`, colocated tests, `tooling/eslint-config.ts` and test. Modify `examples/functional-core/src/features/user/ui/user.presenter.ts`/test and `UserForm.svelte`; create `src/global-alert.presenter.ts`/test; modify `GlobalAlert.svelte`; explicit view-result type files as needed.

**Interfaces:** Rule registered by plugin; `userPresenter({ state })` preserves existing data/reference, adds hasLoadedUser/loadedUserName/loadedUserEmail. `globalAlertPresenter({ alert })` returns isVisible/message. Public config off, private project on.

- [x] Сначала добавить presenter output tests для empty/all statuses/retained data/frozen inputs; ожидаемые literal views. Запустить example tests. Expected: FAIL, новых полей/helper нет.
- [x] Реализовать presenters с named inputs и explicit view types; подключить через $derived с отдельным state selector. Template conditions читают готовые flags.
- [x] Написать config tests default-off/explicit-on/UI-Kit override с сохранением остальных правил и rune/script exclusions; добавить project rule-ID case. Запустить соответствующие tests до config edits: Expected FAIL.
- [x] Зарегистрировать default-off policy и project-on, обновить components. Запустить plugin/config/tooling и example checks. Expected PASS.
- [x] Svelte autofixer для обоих компонентов, production build/browser; commit `[gost-kit-18] feat: opt in to boolean conditions in Svelte example`.

### Task 3: Distribution and final review

**Files:** `packages/eslint-plugin/RULES.md`, README plugin/config/example; `.changeset/ready-boolean-condition.md` (plugin minor, config-svelte patch); plan/spec status.

**Interfaces:** Built public plugin/config, unchanged application state/runtime contracts.

- [x] Документировать правила формы/типа, strictNullChecks/config error, no-provenance guarantee, opt-in/UI-Kit overrides, no autofix.
- [x] `npm run check`, example build and `test:e2e`: Expected PASS.
- [x] `npm pack` plugin/config и установить tarballs во внешний consumer с реальными type services; valid boolean проходит, nullable/computed диагностируются правильным ruleId, default-off и UI-Kit override сохраняются; JS/stateless и TS declarations проверить. Artifacts исключают src/tests, tooling не добавляет @gost-kit/common runtime dependency.
- [x] Один независимый whole-branch review; существенные находки исправить RED→GREEN и повторить нужные checks.
- [x] Commit/push, draft PR closes #18. Не мержить и не публиковать.
