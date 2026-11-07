# API Operation Mapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Добавить переиспользуемую API-операцию и объектную фабрику эффекта с типизированным доменным результатом.

**Architecture:** `api` определяет маршрут и mapResponse, `fc` связывает операцию с actions. Один handler исполняет эффекты с обязательной operation; исключения mapper проходят через onError как contract failure.

**Tech Stack:** Node 26, TypeScript 5.9.3, openapi-fetch 0.17.0, Vitest.

**Spec:** [Утверждённый дизайн](../specs/2026-11-07-api-operation-mapper-design.md)

## Global Constraints

- Эффекты — обычные объекты с `type: 'ApiEffect'`; фабрика возвращает один эффект, Commit.effects — массив.
- Единственный формат — ApiEffect<Operation, SuccessAction, ErrorAction>; handler требует union операций и проверяет схему клиента. Прямой api.request возвращает DTO.
- JSON-only, схема определяет DTO/параметры; mapper определяет доменный callback, свободного response generic нет.
- Common не зависит от Svelte; API не зависит от FC; публичный тип — отдельный файл, тесты рядом, imports без расширений.
- Никаких запросов/mapper/callbacks при создании операции, эффекта и вызове reducer.
- Никаких публикаций, миграции asc-admin и изменений gost-spec #88.

## Review Focus

- Две операции одного маршрута с разными mapper: callbacks коррелируют с конкретной операцией, не с общим DTO.
- Опциональные callbacks не меняют обязательность body/path/query и не запускают запрос при construction.
- Rejected async mapper и исключения callbacks/dispatch должны попадать в разные error paths.
- Эффект без operation отклоняется типами; metadata не утекает в транспорт.
- Потребитель установленного tarball получает те же типы и runtime exports, без исходников/tests.

---

### Task 1: Описание операции и объектная фабрика

**Files:**
- Create: `packages/common/src/api/lib/define-api-operation.ts` и colocated test.
- Create: `packages/common/src/api/types/api-operation.ts`, `api-operation-definition.ts`, `api-operation-options.ts`, `api-operation-data.ts` и внутренние type helpers по необходимости.
- Create: `packages/common/src/fc/lib/create-api-effect.ts` и colocated test.
- Create: `packages/common/src/fc/types/api-effect.ts` и type tests.
- Modify: `packages/common/src/api/index.ts`, `packages/common/src/fc/index.ts`, `packages/common/src/fc/types/api-effect.ts`.

**Interfaces:**
- Consumes: ApiResponse/ApiMethod, upstream FetchOptions, Trigger/DispatchAction/AppError.
- Produces: `defineApiOperation<Paths>()(definition)` с readonly method/url/mapResponse и типовой связью с Paths; `createApiEffect(operation, options)` с inferred independent success/error actions; `ApiEffect<Operation, SuccessAction, ErrorAction>` описывает только эффекты с operation.

- [x] Написать runtime tests identity/mapped operation, construction purity и effect.type/operation/payload/callback identity; type tests endpoint DTO, required body/path/query, bad method/route/parseAs, inferred domain/async result, identity/null/HEAD, wrong actions, same-route different mappers.
- [x] Запустить `npm run check --workspace @gost-kit/common` и `npm test --workspace @gost-kit/common -- --run src/api/lib/define-api-operation.test.ts src/fc/lib/create-api-effect.test.ts`; ожидать ошибки отсутствующего API.
- [x] Реализовать API и type helpers; использовать endpoint lookup вместо повторного разворачивания ApiRequest, phantom witness без runtime поля. options не переопределяют operation/type/method/url.
- [x] Повторить typecheck и тесты; ожидать PASS, включая запрет эффекта без operation.
- [x] Проверить форматирование/lint изменённых TS; закоммитить `[gost-kit-35] feat: define typed API operations and effect factory`.

### Task 2: Единый handler

**Files:**
- Modify: `packages/common/src/fc/lib/create-api-effector.ts`, `create-api-effector.test.ts`.
- Create: `packages/common/src/fc/lib/map-api-result.ts` с colocated test, если выделение помогает сохранить catch только вокруг mapResponse.

**Interfaces:**
- Consumes: Task 1 ApiEffect/ApiOperation/factory, ApiClient/ApiResult/ApiFailure.
- Produces: `createApiEffector<Paths, Action, Operation>(api)` принимает эффекты с operation, dispatch получает mapped action.

- [x] Добавить реальные client+injected-fetch tests: snake_case DTO → domain → action → dispatch; operation metadata отсутствует в request. Операция с mapper и identity-операция.
- [x] Добавить tests identity/null/204/HEAD; async mapper; sync/rejected mapper → `{kind: 'contract', errors: []}` + `[defaultError]`; mapper без onSuccess всё равно исполняется, без onError failure throws.
- [x] Проверить failure kinds http/network/aborted/contract без mapper; callback/dispatch exceptions и unexpected client throws не переклассифицируются. Проверить ожидание mapper и dispatch.
- [x] Запустить `npm test --workspace @gost-kit/common -- --run src/fc/lib/create-api-effector.test.ts`; новые assertions должны FAIL до реализации.
- [x] Требовать Operation generic и operation; strip metadata, transport один раз; await mapResponse внутри узкого catch, callbacks снаружи.
- [x] Выполнить common typecheck/full tests и lint; ожидать PASS; закоммитить `[gost-kit-35] feat: map API operation results in shared handler`.

### Task 3: Пример и поставляемый публичный API

**Files:**
- Modify: `examples/functional-core/src/api/paths.ts`, synthetic API/fake API и их tests.
- Create: `examples/functional-core/src/features/user/data/mappers/map-user.ts` с test и `data/api/load-user.ts`.
- Modify: feature reducer/test, root effect/effector, README example/common.
- Create: `.changeset/api-operation-mapper.md` (common minor).

**Interfaces:**
- Consumes: Task 1 factories и Task 2 handler.
- Produces: пример distinct DTO/domain, один глобальный handler и документированная публичная установка.

- [x] Обновить reducer/mapper tests под snake_case DTO и User domain; reducer проверяет массив effects, operation identity, payload и callbacks, без HTTP/mapper при construction. Запустить example tests: новые ожидания FAIL.
- [x] Обновить synthetic Paths/transport/fake DTO, добавить mapper/operation, заменить raw effect на createApiEffect, добавить typeof loadUser в RootEffect/handler generic. UI и поведение загрузки/ошибки/retry сохраняются.
- [x] Описать API, error path, JSON-only и обязательную operation в README; добавить common minor changeset.
- [x] Выполнить `npm run check`, `npm --prefix examples/functional-core run build`, `npm --prefix examples/functional-core run test:e2e`; ожидать PASS.
- [x] Выполнить npm pack common в scratch и установить tarball во внешний consumer; проверить root exports/runtime mapper+handler и TS positive/negative contracts. Проверить отсутствие tests/src в tarball.
- [x] Закоммитить `[gost-kit-35] docs: demonstrate API operation mapping`.

### Task 4: Финальная проверка

**Files:** исправления только по подтверждённым находкам, если нужны.

**Interfaces:** Consumes Tasks 1–3; produces reviewable branch #35.

- [x] Проверить весь diff против спецификации, запросить одно независимое ревью всей ветки.
- [x] Для существенных находок написать RED regression, исправить, получить GREEN и повторить нужные checks.
- [x] Проверить git status, итоговые commits/checks и подготовить отчёт с ограничениями. Не мержить и не публиковать.


### Task 5: Удаление прежнего формата по уточнению владельца

**Interfaces:** `ApiEffect<Operation, SuccessAction, ErrorAction>`; `createApiEffector<Paths, Action, Operation>(api)`.

- [x] Зафиксировать RED type test: handler должен отклонять эффект без operation.
- [x] Удалить прежний тип/ветку, объединить operation effect в ApiEffect, убрать fallback проверки operation, перевести тесты на фабрику и обновить пример.
- [x] Обновить документацию и changeset; проверить common/example/full check, собранный tarball и внешний consumer.
- [x] Провести независимое ревью изменения; исправить подтверждённые находки, commit/push и обновить PR #36.


### Task 6: Раздельные типы success/error actions

**Interfaces:** `ApiEffect<Operation, SuccessAction, ErrorAction>`; shared handler проверяет оба callback результата в RootAction.

- [x] Написать RED type tests для отдельных action roles, перепутанных callbacks и inferred factory → declared effect.
- [x] Разделить типы ApiEffect и сохранить независимый вывод фабрики; обновить внутренний тип handler и эффекты примера.
- [x] Проверить optional callbacks/never, scoped feature actions, payloads, unions, schema requirements и отрицательные случаи внешнего consumer.
- [x] Обновить docs/changeset, выполнить root check и проверить tarball; ревью, commit/push и обновление PR #36.


### Task 7: Исправления опубликованного ревью PR #36

**Interfaces:** публичный контракт эффекта сохранён; ApiEffectFields — внутренняя общая декларация полей, SingleApiOperation экспортирован, неиспользуемый ApiRequest удалён.

- [x] Проверить шесть замечаний по коду. Удалить ApiRequest и дублирование endpoint-options; перенести type-тесты к ApiClient.
- [x] Убрать полный cast эффекта; проверить mutation-сценарий переименования defaultError → ошибка компиляции handler.
- [x] Добавить прямые mapApiResult tests и доказать мутациями покрытие ветвей transport failure/mapper exception.
- [x] Экспортировать SingleApiOperation, проверить типовой контракт и описать удаление raw-формата/путь миграции в changeset.
- [x] Выполнить полный check и browser/build; проверить пакет и внешний consumer после удаления ApiRequest.
- [x] Commit/push и обновить PR #36 с результатами проверок.


### Task 8: Имена таблиц обработчиков

- [x] Переименовать фабрику в createApiEffector, таблицу shell — в shellEffector; обновить imports/exports, tests/docs и changeset без старого alias.
- [x] Проверить полный check и внешний consumer с новым именем; commit/push в PR #36.
