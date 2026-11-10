# Functional core with a Svelte 5 root store

An executable private example for [gost-kit#2](https://github.com/antonsmolko/gost-kit/issues/2),
supporting the functional-core investigation in [#1](https://github.com/antonsmolko/gost-kit/issues/1).
It demonstrates the component-to-store flow with a small Svelte shell.
The example is private and does not define a published package API.

## Run

Use Node 26. From the repository root:

```sh
npm ci
npm run build
npm --prefix examples/functional-core ci
npm --prefix examples/functional-core run dev
```

Open the localhost URL printed by Vite. Enter an email and click **Load user**.
The synthetic API returns Ada Lovelace after a short delay. Use
`error@example.test` to get an error and a global notification. Change the email
and retry. There are no API network requests.

## Local UI-component state

The “Local UI state” section also demonstrates two independent Disclosure
instances and an app-controlled one. Reset the first local instance without
changing the second. The controlled instance forwards a boolean through one root
action; its UI-Kit implementation knows nothing about application actions.

See [the component-state guide](docs/ui-component-state.md) for both ownership
modes, typed bind:this/reset, error semantics and tests. This example uses existing
public APIs; it adds no package or library exports.

## Read the example

Start with `src/UserForm.svelte`. It imports `rootStore` from `src/store/root.ts`,
gets the shared instance with `const root = rootStore()`, reads
`$derived(root.state.user)`, computes view state with `userPresenter` in a second
`$derived`, and sends plain action objects through
`root.dispatch()`. Global
notifications are rendered by `src/GlobalAlert.svelte`, outside the user feature.

The form keeps feature selection in its own `$derived` and feeds it to a second
one for presentation:

```ts
const user = $derived(root.state.user);
const viewState = $derived(userPresenter({ state: user }));
```

An unrelated root update rechecks the user reference but does not call the
presenter when that reference is unchanged. The store uses ordinary immutable
snapshots and raw reactive replacement; no separate UI root view is needed.

```text
component: dispatch({ scope: 'users', type: 'SetEmailAction', email })
→ reducer returns { state, effects: [] }
→ shell replaces the complete state
→ Svelte updates the component

component: await dispatch({ scope: 'users', type: 'LoadAction' })
→ reducer returns loading state + ApiEffect
→ shell commits state and starts the effect
→ shared API client executes the injected synthetic fetch and normalizes the DTO result
→ operation.mapResponse converts DTO to the domain User
→ onSuccess/onError creates SuccessReceiveAction / ErrorReceiveAction with scope: 'users'
→ await dispatch(callback action)
→ on failure: DispatchActionEffect sends global ShowAlertAction
→ the original dispatch completes after the nested actions/effects complete
```

- `src/store/types/`: root action/effect unions, state/store types, global actions, API contracts and effect payloads.
- `src/features/user/data/`: schema-derived DTO alias, pure mapper and reusable API operation.
- `src/features/user/domain/entities/`: user entity.
- `src/features/user/domain/fc/`: user actions, reducer handlers, state type and initializer.
  All actions/effects are objects.
- `src/features/user/ui/`: pure `userPresenter` and its tests. It derives the form
  loading flag and view data from explicit feature state, without store or Svelte imports.
- `src/store/fc/reducer.ts`: composes user handlers with application-level alert handling.
  Tables are keyed by action scope, handlers by action type; `reducing` normalizes their results into
  full state and an array of effect descriptions.
- `@gost-kit/svelte`: `createStore` stores reactive state with `$state.raw` and
  connects it to framework-independent dispatch from `@gost-kit/common`.
- `src/api/paths.ts`: the synthetic OpenAPI contract; it contains no production schema.
- `src/api/create-synthetic-api.ts`: shared synthetic transport and request validation,
  used by the demo and tests. `fake-api.ts` supplies the delayed success/failure operation.
- `src/store/fc/effector.ts`: composes the shared API handler and forwarding actions.
  API dependencies are injected; reducers never execute a request.
- `src/store/fc/state.ts`: composes user initial state with application-level state.
- `@gost-kit/common`: handler definitions, table composition, dispatch execution,
  shared types and guards, built from `../../packages/common`. Dispatch commits
  state before waiting for parallel effects through `Promise.allSettled`.
- `src/store/root.ts`: store factory and access to the shared application store instance.

## Handler tables and root composition

Feature action declarations contain only local type names and payloads.
`src/store/types/action.ts` passes the central scope map directly to `ScopedActions`:
`RootAction = ScopedActions<{ users: UserAction; root: ShowAlertAction }>`. The helper
builds the root union and adds scopes automatically. UI calls and API callbacks
supply `scope: 'users'`; application-level `ShowAlertAction` omits scope by default.
`reducing` first selects the table by `action.scope ?? 'root'`, then selects
the handler by `action.type`. Different namespaces can use the same action type
with different payloads. The original action object is preserved.

`define.reducer<UserState, UserAction, RootEffect, RootState>()({...})` defines a feature table.
Its keys are action type names, and each handler receives `({ state, action }, rootState)`
with feature state and that action's specific payload type. The second argument
provides the entire current root state, including other features, auth and global
configuration when present. Both state inputs are deeply readonly at compile time.
The handler returns complete `UserState`, not `RootState`. Its inferred result is
checked for extra state keys without a return annotation.
`createApiEffector<Paths, RootAction, ApiOperation>(api)` supplies the common API effect table.
`define.effector<RootAction, DispatchActionEffect>` defines the remaining table;
handlers receive `{ effect, dispatch }`. Each table covers its declared effect union.

The root assembles feature and application tables:

```ts
const reducer: Reducer<RootState, RootAction, RootEffect> = reducing({
  users: scope('user', userReducer),
  root: appReducer,
});

const effector: Effector<RootAction, RootEffect> = effecting(
  createApiEffector<Paths, RootAction, ApiOperation>(api),
  shellEffector,
);
```

See `src/features/user/domain/fc/reducer.ts` for user handlers,
`src/store/fc/reducer.ts` for root composition, and `src/store/fc/effector.ts`
for effect execution. The
builders return typed tables; the composition functions return the ordinary
reducer/effector functions consumed by the store.

A reducer handler may return `{ state }`, `{ effects }`, both, or no result.
When present, `state` must be complete; there is no partial-state merge.
`scope('user', userReducer)` adapts feature state back to `RootState.user`,
preserving all other root properties and forwarding effects unchanged.
Missing/undefined state retains the current state. An effect can be a single
object or an array; omitted effects become `[]`. The store always receives a
complete `{ state, effects: [] }` commit after normalization. An unregistered
action keeps the same state with no effects; an unregistered effect is ignored.
Every declared action needs a handler within its namespace. The required map
rejects missing namespaces and missing/optional handlers; object literals reject
unknown keys and duplicate scope/type declarations. Overwrites already performed
by object spread cannot be detected at this boundary. Use `reducing({})` for
`never` actions. Effect tables still use statically known tuples, with coverage
and duplicate-owner checks; dynamic arrays are rejected. Use `effecting()` for
`never` effects. Result annotations provide the state/action/effect types while
preserving inline handler inference.
These APIs expect trusted typed application objects; they do not validate external input at runtime.

## Applying functional core in a feature

The runnable feature separates DTOs, API operations and domain state:

```text
features/user/
  data/
    dto/user-dto.ts
    mappers/map-user.ts
    mappers/map-user.test.ts
    api/load-user.ts
  domain/
    entities/user.ts
    fc/action.ts
    fc/reducer.ts
    fc/reducer.test.ts
    fc/state.ts
  ui/
    user.presenter.ts
    user.presenter.test.ts
```

`data/dto/user-dto.ts` derives its type from synthetic Paths using ApiResponse;
it does not duplicate the schema. The API returns user_id/full_name/email.
`mapUser` converts it to the domain User with id/name/email. The domain entity
has no transport or Svelte dependencies.

`data/api/load-user.ts` defines method/url/mapResponse with
`defineApiOperation<Paths>()`. In the reducer, `createApiEffect(loadUser, options)`
returns a plain effect object. Its onSuccess receives User and returns a scoped
action; the reducer then applies it to state. No mapper or HTTP executes while
the reducer describes the effect. The root declares `ApiOperation = typeof loadUser`
and includes it in ApiEffect and the single shared createApiEffector.

The direction is FC → data/api → mapper → domain/entities. Data/API does not
import feature actions/reducers, and the shared client knows only Paths.
A root store composes feature state/actions/reducers with application-level
state/actions, including global notifications.

## Execution rules

`dispatch` returns a successful `Promise<void>` even when reducer/effect code
fails: errors are caught and reported inside dispatch. Components do not need
try/catch or promise rejection handlers. State is committed synchronously before
any await or effect execution. Awaiting dispatch waits for that commit's effects,
including any nested dispatch awaited by those effects. Error reporting runs
synchronously.
Without await the caller continues immediately. It does not wait for unrelated
dispatches or a browser paint. Completion means processing finished, not that
the business operation succeeded; feature state carries the API outcome.

Effects from one commit start in parallel. A dependent step can be described by
an action produced by the first effect's callback. There is no separate scheduler.
`Promise.allSettled` waits for every started effect, even after another effect
fails. Once all effects settle, failures are sent to `onError` in effect order.
Synchronous effect throws are captured too, and do not prevent sibling effects
from starting. A reducer exception is reported before effects start; a pure
reducer's previous state is retained. Errors in processing an invalid reducer
commit are also caught by dispatch and reported as reducer failures.
Effects are not cancelled or rolled back; a never-settling effect keeps dispatch
pending. Unrelated dispatches and unawaited work are outside this completion boundary.

Configure the store's optional synchronous `onError` callback for centralized
reporting. It receives `StoreError` with kind `readState`, `reducer`, `writeState`
or `effect`, plus the original action and error; effect failures also include the
effect. The callback returns void and is called without awaiting a result.
The default logs to `console.error`. If the callback throws synchronously, a
console fallback records the original failure and reporting error. A nested
dispatch reports its own failures and resolves, so the parent does not report the
same failure again. The Svelte adapter includes the callback in
`createDispatch(config)`.

`ApiEffect<ApiOperation, SuccessAction, ErrorAction>` comes from `@gost-kit/common`. It describes a
lowercase `method`, a schema path in `url`, typed `params`/`body`, `defaultError`
and optional `onSuccess`/`onError` action factories. This example always supplies
both callbacks so the feature leaves loading. Its effect type selects the
scoped SuccessReceiveAction and ErrorReceiveAction separately from RootAction,
so callbacks cannot return each other's action. The handler awaits the returned
action's dispatch; it never interprets HTTP itself.

`createApiClient<Paths>` uses openapi-fetch with an injected synthetic fetch. It
returns `{ type: 'ok', data }` or `{ type: 'error', error }`, where failure.kind is
http/network/contract/aborted. `mapErrors` can centrally decode a backend's errors
into `AppError[]`; without it, the array is empty. The handler sends nonempty
errors to the effect's `onError`, or `[defaultError]` when none are available.
`AppError` has code/message/path; its request-level path is empty. Raw transport
exceptions are not retained in failures or displayed to the user.

Missing success callbacks skip dispatch. Missing error callbacks reject the
failure to store-level reporting. A mapResponse exception becomes a contract
failure and reaches onError with the fallback, so this example exits loading
and shows an alert. Unexpected client errors and callback/dispatch exceptions
propagate without being reclassified as request errors or retried. Reducer
failures in callback-generated actions are reported by their own dispatch.
Distinguish the effect's domain `onError` from the store's execution-error callback.

The client parses successful JSON once and handles 204/HEAD as undefined. It
does not validate the runtime shape against OpenAPI. This example defines only
POST `/user`, with no real network, DTO validation or True Myth integration.
State is immutable by convention and TypeScript readonly fields; it is not frozen
at runtime. Components send actions instead of mutating state directly. Previous
loaded data is retained during loading/error. Global alerts remain in state.

No reset, pipes, hooks, persistence, SSR demo, cancellation or stale-response
protection is included. Separate root instances are isolated.
The form disables loading while a request is pending; programmatic overlapping
requests have no ordering guarantees beyond their completion order.

## Verify

```sh
npm --prefix examples/functional-core run check
npm --prefix examples/functional-core run build
cd examples/functional-core
npx playwright install chromium
npm run test:e2e
```

Unit/integration tests cover pure transitions, full-state replacement, parallel
execution, awaited nested dispatch, error handling and isolated root instances.
Presenter tests cover each status, retained loaded data and unchanged inputs.
Browser tests exercise input reactivity, disabled/loading controls, success, a
global error notification and retry through the actual components.

## Autofix and style checks

After the root build and example install, from this directory:

```sh
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run fix
```

`fix` runs ESLint autofixes followed by Prettier. Some lint errors need manual
changes. `check` includes lint/format checks, type checking and tests; the root
`check` performs the same coverage without repeating the style checks.
The project consumes the Svelte ESLint configuration and the shared Prettier
configuration; the Prettier Svelte plugin is connected locally. The repository's [adapter](../../tooling/eslint-config.ts) adds project globals
and explicitly enables `gost/no-component-state` and
`gost/single-intent-dispatch` and `gost/ready-boolean-condition` for `src/**/*.svelte`;
`bind:this` refs remain permitted while logical state lives in root/features;
the published Svelte config owns component parsing and shared policies. Dependencies/config
exports must be prepared in the repository first; the example is not a standalone
copy of the published packages.

## Baseline

The browser setup follows the maintained
[Vite Svelte TypeScript template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-svelte-ts).
Reactivity and instance access use supported Svelte
[`$state.raw`](https://svelte.dev/docs/svelte/$state#state.raw),
[`$derived`](https://svelte.dev/docs/svelte/$derived).
Tests follow [Svelte's Vitest/Playwright guidance](https://svelte.dev/docs/svelte/testing).
The small shell demonstrates the awaited-dispatch contract and keeps effect
execution outside the pure reducers.

The example demonstrates FC/shell integration using native DOM controls. Its
`SubmitEvent`/input adaptation is not a reference for the business/UI-Kit boundary:
in application business features, library components own browser events and
expose semantic callbacks/ready values. The intent rule catches direct dispatch
cascades/branches; it does not prove the absence of every browser API. A UI-Kit
component extraction and local-state design are separate work (#27).

The boolean condition policy is enabled for this example. userPresenter returns
hasLoadedUser plus loadedUserName/loadedUserEmail; globalAlertPresenter returns
isVisible/message. Components keep separate state selectors and reactive presenter
calls. Conditions read those boolean fields instead of nullable object truthiness.
Loaded data stays visible during loading/error, and both presenters have ordinary
function tests with deterministic outputs and preserved inputs.
