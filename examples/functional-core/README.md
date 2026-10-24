# Functional core with a Svelte 5 root store

An executable private example for [gost-kit#2](https://github.com/antonsmolko/gost-kit/issues/2),
supporting the functional-core investigation in [#1](https://github.com/antonsmolko/gost-kit/issues/1).
It demonstrates the component-to-store flow with a small Svelte shell.
The example is private and does not define a published package API.

## Run

Use Node 26. From the repository root:

```sh
npm ci
npm run build --workspace @gost/common
npm run build --workspace @gost/svelte
npm --prefix examples/functional-core ci
npm --prefix examples/functional-core run dev
```

Open the localhost URL printed by Vite. Enter an email and click **Load user**.
The synthetic API returns Ada Lovelace after a short delay. Use
`error@example.test` to get an error and a global notification. Change the email
and retry. There are no API network requests.

## Read the example

Start with `src/UserForm.svelte`. It imports `rootStore` from `src/store/root.ts`,
gets the shared instance with `const root = rootStore()`, reads
`$derived(root.state.user)` and sends plain action objects through
`root.dispatch()`. Global
notifications are rendered by `src/GlobalAlert.svelte`, outside the user feature.

```text
component: dispatch(UserSetEmailAction)
→ reducer returns { state, effects: [] }
→ shell replaces the complete state
→ Svelte updates the component

component: await dispatch(UserLoadAction)
→ reducer returns loading state + ApiEffect
→ shell commits state and starts the effect
→ injected fake API resolves/rejects
→ receiver creates UserSuccessReceiveAction / UserErrorReceiveAction
→ await dispatch(receiver action)
→ on failure: DispatchActionEffect sends global ShowAlertAction
→ the original dispatch completes after the nested actions/effects complete
```

- `src/store/types/`: root action/effect unions, state/store types, global actions, API contracts and effect payloads.
- `src/features/user/domain/entities/`: user entity.
- `src/features/user/domain/fc/`: user actions, reducer handlers, state type and initializer.
  All actions/effects are objects.
- `src/store/fc/reducer.ts`: composes user handlers with application-level alert handling.
  Handlers are keyed by action type; `reducing` normalizes their results into
  full state and an array of effect descriptions.
- `@gost/svelte`: `createStore` stores reactive state with `$state.raw` and
  connects it to framework-independent dispatch from `@gost/common`.
- `src/store/fc/effector.ts`: request execution and forwarding actions. API dependencies
  are injected; reducers never execute a request.
- `src/store/fc/state.ts`: composes user initial state with application-level state.
- `@gost/common`: handler definitions, table composition, dispatch execution,
  shared types and guards, built from `../../packages/common`. Dispatch commits
  state before waiting for parallel effects through `Promise.allSettled`.
- `src/store/root.ts`: store factory and access to the shared application store instance.

## Handler tables and root composition

`define.reducer<RootState, UserAction, RootEffect>({...})` defines a feature table.
Its keys are action type names, and each handler receives `{ state, action }`
with that action's specific payload type. `define.effector<RootAction, ApiEffect>`
defines an effect table with handlers receiving `{ effect, dispatch }`.
Each definition must cover its declared action/effect union.

The root assembles feature and application tables:

```ts
const reducer: Reducer<RootState, RootAction, RootEffect> = reducing(
  userReducer,
  appReducer,
);

const effector: Effector<RootAction, RootEffect> = effecting(
  apiEffector(api),
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
Missing/undefined state retains the current state. An effect can be a single
object or an array; omitted effects become `[]`. The store always receives a
complete `{ state, effects: [] }` commit after normalization. An unregistered
action keeps the same state with no effects; an unregistered effect is ignored.
Every declared action/effect must have exactly one owner: composition rejects
missing handlers, optional-only coverage and duplicate table keys at compile time.
Empty composition is allowed when the action/effect type is `never`.
Supply statically known tables or tuples; widened dynamic arrays
are rejected because unique ownership cannot be proven. Result annotations
provide the state/action/effect types while preserving inline handler inference.
These APIs expect trusted typed application objects; they do not validate external input at runtime.

## Applying functional core in a feature

Use `fc` as the short directory name for functional core. For example:

```text
features/user/
  app/
    dto/
      user.dto.ts
      user.response.ts
      user.request.ts
    mappers/
      mapUserDtoToState.ts
      mapUserStateToRequest.ts
  domain/
    entities/
      user.ts
  fc/
    action.ts
    reducer.ts
    reducer.test.ts
    state.ts
```

- `app/dto/user.dto.ts` describes the user data transferred by the API.
  `user.response.ts` describes the response envelope, if the endpoint has one;
  `user.request.ts` describes the POST request body.
- `domain/entities/user.ts` defines the business `User` type without API or Svelte
  dependencies. DTO types and business entities do not have to share a shape.
- `mapUserDtoToState` converts API DTO data into the data used by feature state.
  The reducer decides how to apply that data and update loading/error status.
  `mapUserStateToRequest` converts feature state into the request body; it does
  not send a request. Neither mapper performs I/O or mutates its input.
- These API boundary mappers are placed in `app/mappers` rather than
  `domain/mappers`: they connect API-specific DTOs with the feature's state,
  keeping business entities independent of the transport format.
- `fc/action.ts` defines the feature action union. `fc/state.ts` defines feature
  state and its initializer. `fc/reducer.ts` implements pure transitions returning
  `{ state, effects }`; `fc/reducer.test.ts` verifies the transitions and absence
  of mutations without a network or Svelte component.

This is the application structure for a feature, not a required directory tree
for every project. Create request/envelope types only when the API needs them.
A root store composes feature state/actions/reducers with application-level
state/actions, including global notifications. Features may emit an effect
containing an action handled by another feature or the application level.

The runnable example separates root composition in `src/store/` from user
logic in `src/features/user/domain/`. The injected fake API already returns
trusted `User` data. It therefore has no
DTO mappers or real HTTP layer. The tree above explains how to apply the same
flow when an actual API boundary is introduced.

## Execution rules

`dispatch` returns a successful `Promise<void>` even when reducer/effect code
fails: errors are caught and reported inside dispatch. Components do not need
try/catch or promise rejection handlers. State is committed synchronously before
any await or effect execution. Awaiting dispatch waits for that commit's effects,
including any nested dispatch awaited by those effects, and error reporting.
Without await the caller continues immediately. It does not wait for unrelated
dispatches or a browser paint. Completion means processing finished, not that
the business operation succeeded; feature state carries the API outcome.

Effects from one commit start in parallel. A dependent step can be described by
an action produced by the first effect's receiver. There is no separate scheduler.
`Promise.allSettled` waits for every started effect, even after another effect
fails. Once all effects settle, failures are sent to `onError` in effect order.
Synchronous effect throws are captured too, and do not prevent sibling effects
from starting. A reducer exception is reported before effects start; a pure
reducer's previous state is retained. Errors in processing an invalid reducer
commit are also caught by dispatch and reported as reducer failures.
Effects are not cancelled or rolled back; a never-settling effect keeps dispatch
pending. Unrelated dispatches and unawaited work are outside this completion boundary.

Configure the store's optional `onError` callback for centralized reporting.
It receives a `StoreError`: `{ kind: 'reducer', action, error }` or
`{ kind: 'effect', action, effect, error }`. The default handler calls
`console.error` with this context. An async callback is awaited; if the callback
throws/rejects, a console fallback records the original failure and reporting
error. Reporters should complete; a pending reporter keeps
its dispatch pending. A nested dispatch reports its own failures and resolves,
so the parent does not report the same failure again.

`ApiEffect.receiverSuccess`, `receiverError` and `defaultError` are required.
`AppError` contains `code: string`, `message: string` and `path: readonly string[]`;
an empty path describes a request-level error. In this synthetic API example,
request throws/rejections send `[effect.defaultError]` to `receiverError`, whose
action lets the feature leave `loading` and display its configured error message.
The feature reducer remains responsible for its status transitions. The raw
exception is not shown to the user. The fake API returns only a trusted `User`
or rejects; server validation/result envelopes are outside this example.
Receiver exceptions go to the store's `onError` instead of being converted
into request errors or retried. Reducer failures in receiver-generated actions
are reported by that nested dispatch. Expected API failures stay in the domain
receiver flow; `onError` handles unexpected execution failures. There is no
recursive receiver retry pipeline.

The API dependency returns trusted typed data. This example defines only `/user`
and does not implement HTTP, response validation or True Myth integration.
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
Browser tests exercise input reactivity, success, a global error notification
and retry through the actual components.

## Baseline

The browser setup follows the maintained
[Vite Svelte TypeScript template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-svelte-ts).
Reactivity and instance access use supported Svelte
[`$state.raw`](https://svelte.dev/docs/svelte/$state#state.raw),
[`$derived`](https://svelte.dev/docs/svelte/$derived).
Tests follow [Svelte's Vitest/Playwright guidance](https://svelte.dev/docs/svelte/testing).
The small shell demonstrates the awaited-dispatch contract and keeps effect
execution outside the pure reducers.
