# @gost-kit/common

Shared TypeScript types, runtime guards and framework-independent functional core.
Import through `@gost-kit/common`.
Requires Node 26 (`^26.0.0`).

Guard implementation and its URL helper live in `src/sharred/lib`.

`JSONValue` and `JSONObject` are exported from the public API. They describe
recursive JSON primitives, arrays and string-keyed objects, including `null`
and excluding `undefined`.

```ts
import {
  createDispatch,
  guard,
  reducing,
  type Nlx,
  type Reducer,
} from '@gost-kit/common';

type Action = { type: 'IncrementAction' };
const reducer: Reducer<number, Action, never> = reducing({
  root: { IncrementAction: ({ state }) => ({ state: state + 1 }) },
});
```

`define.reducer<TState, TAction, TEffect, TRootState>()({...})` and
`define.effector<TAction, TEffect>({...})` define narrowed handler tables.
The reducer's first call sets the contracts; the second infers each handler's
result and checks its state shape with `ExactState` without return annotations.
Handlers receive `({ state, action }, rootState)`. Both state inputs
are deeply readonly views of objects and arrays at compile time; no runtime
freezing is performed. `TRootState` defaults to `TState` for root handlers.
Returning the readonly feature state unchanged is supported, including arrays;
handlers do not have to clone unchanged values.

Declare namespaces centrally with `ScopedActions`, keeping feature action types local:

```ts
import type { ScopedActions } from '@gost-kit/common';

type UserAction = { type: 'LoadAction'; page: number };
type RootAction = ScopedActions<{
  users: UserAction;
  root: { type: 'ShowAlertAction'; message: string };
}>;
```

The `users` branch gains required `scope: 'users'`. The root branch accepts omitted
or explicit `scope: 'root'` without declaring it in the local action type.
`scope` is reserved for routing: local action types must not declare it,
including an optional scope. Conflicts are rejected at the `ScopedActions` map
declaration. For manually scoped unions, feature scopes must be required;
only root may have an optional scope.
`Dispatch` also accepts ordinary unscoped root action declarations, so it applies
`DispatchAction` independently. Applying it again to `ScopedActions` preserves
the accepted actions.
`ActionScope` lists the namespaces, `ActionsInScope` selects their action variants,
and `ScopedReducerHandlers` describes the grouped handler contract. `reducing`
selects a table by `action.scope ?? 'root'`, then its handler by `action.type`.
Equal action type names in different namespaces retain their own payloads and
handlers. The original action object is passed through without adding scope.
Effects continue to route by type alone.

`ExactState` checks nested state shapes and catches extra keys in object literals,
but compatible union members can hide extra fields. For `items: { id: string }[]`,
`[...state.items, { id: 'a', extra: true }]` is accepted. Required fields and value
types are still checked. This simpler implementation remains the reducer default.

`ExactStateStrict` is kept alongside it for comparison and is not connected to
`define.reducer`. It rejects the mixed-array example by checking every inferred
variant, including nested keys. It supports declared nullable/discriminated unions
and tracks exact type pairs to finish checking recursive states. These additional
checks make its implementation more complex; tests document the difference.

Feature handlers receive and return their own complete state. Adapt them to a
root property with `scope` before composing:

```ts
import { define, reducing, scope, type Reducer } from '@gost-kit/common';

type UserState = { name: string };
type RootState = { user: UserState; auth: { user: { name: string } } };
type LoadAction = { type: 'LoadAction' };

const userHandlers = define.reducer<UserState, LoadAction, never, RootState>()({
  LoadAction: ({ state }, rootState) => ({
    state: { ...state, name: rootState.auth.user.name },
  }),
});
const rootReducer: Reducer<RootState, LoadAction, never> = reducing({
  root: scope('user', userHandlers),
});
```

`scope` supplies the current complete root state to feature handlers and replaces
only the selected root property. Effects pass through unchanged; omitted state
or returning the same feature state reference preserves the root state reference.
The state key and action namespace are independent: for example,
`reducing({ users: scope('user', userHandlers) })` routes users actions to the
user state property when its result is annotated with the matching `Reducer`.

`reducing` takes one namespace map with a complete handler table per namespace.
The result's `Reducer<TState, TAction, TEffect>` annotation (or explicit generic
arguments) supplies the contracts and preserves inline handler inference.
Without either contract, generics default to `never` and nonempty namespace maps
are rejected, including callbacks without parameters. Only an empty map is valid
for `never` actions.
Missing and optional handlers are rejected; object literals also reject unknown
namespaces/actions and duplicate scope/type keys. Composition cannot detect
handlers already overwritten by object spread before they reach the API.
Maps from variables use TypeScript structural compatibility: required handlers
and payloads are checked, but additional handlers or namespaces may be present.
Use `reducing({})` for `never` actions. Reducers normalize omitted state/effects
into a complete commit.

`effecting` continues to compose statically known tuples of tables, with exactly
one handler for each declared effect type. Missing/optional handlers, duplicate
owners and dynamic arrays are rejected; `effecting()` accepts `never` effects.

`logReducer` includes feature scope in log titles (`users/LoadAction`), so equal
action names from different namespaces are distinguishable. Omitted or explicit
root scope keeps the plain action name. Effect titles continue to use their type.

The current `logger` prototype implements output only for `info`; `error`, `warn`,
`trace` and `debug` intentionally remain no-op placeholders. Completing logging
is tracked separately in [#4](https://github.com/antonsmolko/gost-kit/issues/4).
Messages are passed as data to a fixed console format, so `%s`/`%o` in a message
stay literal and do not consume the payload.

`safeRun.sync` and `safeRun.async` preserve thrown `Error` instances. Other thrown
or rejected values are wrapped in an `Error` with the original value in `cause`,
including `null` and `undefined`. Both paths use the same internal normalization;
the public `Result` contract is unchanged.

`define.state` accepts a ready-made plain state object or a factory receiving
one optional options object. Options are constrained to `Partial<TState>` so
overrides keep the corresponding state property types. Factories must handle
a call without options, for example by defaulting their parameter to `{}`.

`define.state(initialState)` accepts a ready-made plain state object and returns
a function taking optional `Partial<TState>` overrides:

```ts
import { define } from '@gost-kit/common';

const createState = define.state({ counter: 0, name: '' });

createState();
createState({ counter: 1 });
createState({ name: 'example' });
```

The result is a shallow spread: supplied properties replace the initial values,
including explicit `undefined` and `null`. Include these in the corresponding
state property types when they are valid values. Nested values are shared with the
initial object; construct a fresh initial object when nested values must be
independent. A function input is treated as a state factory. Reducer definitions
default to `never` effects when no effect type is supplied; effectful reducers
must declare their effect union.

`createDispatch(config)` receives `reducer`, `effector`, `readState`, `writeState`
and optional `onError` in the same config. The error callback is synchronous,
with contract `(failure: StoreError<TAction, TEffect>) => void`.
It is called without awaiting a result; the default logs to `console.error`.
A synchronous handler failure uses the existing console fallback.

The draft [createDispatch contract and test cases](docs/createDispatch.spec.md)
separates execution coverage from Svelte binding tests.

State is committed synchronously before effects start. Effects start in parallel;
dispatch waits for all of them and for nested dispatches awaited by those effects.
Reducer/effect failures are reported, and dispatch resolves successfully. Pending
effects keep dispatch pending.

```ts
let state = 0;
const dispatch = createDispatch<number, Action, never>({
  reducer,
  effector: async () => {},
  readState: () => state,
  writeState: (next) => {
    state = next;
  },
  onError: (failure) => {
    console.error(failure);
  },
});
await dispatch({ type: 'IncrementAction' });
```

This package does not depend on Svelte. The `@gost-kit/svelte` package supplies
reactive state through the same callbacks. Guards check the condition they
name; collection guards do not validate element types. External data still
requires validation of the complete relied-on contract.

Build with `npm run build --workspace @gost-kit/common` from the repository root.
Source imports may omit file extensions and directory `index` names. TypeScript
uses Bundler resolution; `tsc-alias` resolves emitted imports to explicit `.js`
paths for Node.js, including imports in declarations.
Public types have individual source files and are exported from the package
root. The package distributes JavaScript and declarations in `dist`, excluding
tests.

## API client and effects

`createApiClient` is framework-independent and uses openapi-fetch 0.17.0. Supply
an OpenAPI `paths` type and explicit configuration; no Svelte, browser origin,
storage or application schema is imported. The upstream API and serialization
baseline is documented at https://openapi-ts.dev/openapi-fetch/api.

```ts
import {
  createApiClient,
  createApiHandler,
  effecting,
  type ApiEffect,
} from '@gost-kit/common';
import type { paths } from './schema';

type Action = { type: 'LoadedAction'; name: string } | { type: 'FailedAction' };
const api = createApiClient<paths>({ baseUrl: 'https://api.example.test' });
// The path/method/options and result below depend on your actual schema.
const result = await api.request('get', '/users/{id}', {
  params: { path: { id: 1 } },
});

type Effect = ApiEffect<paths, Action>;
const handlers = createApiHandler<paths, Action>(api);
const effector = effecting<Action, Effect, readonly [typeof handlers]>(
  handlers,
);
```

Methods are lowercase (`get`, `post`, `put`, `patch`, `delete`, `head`, `options`,
`trace`). The client keeps upstream method/path/init generics: `request(method, url, options)`.
The schema determines available methods/paths, required path/query params, request
bodies and successful response types. The third argument is optional only when
the operation has no required options. `body` and `params` are
separate: one request can use both. There is no arbitrary response-type generic.
The initial contract supports JSON parsing; `parseAs: 'text'` and other modes
are outside it. Upstream serializers, headers, credentials and fetch injection
remain configurable, without application-specific defaults.

The result is `ApiResult<TData>`:

- `{ type: 'ok', data }`: JSON data, preserving JSON null; 204 and HEAD return
  undefined. Other successful empty or non-JSON responses are contract failures.
  JSON and application/*+json content types are accepted. Combined Content-Type
  values are rejected as contract failures, even when identical; commas in quoted
  parameters remain valid. This singleton policy follows
  [RFC 9110 section 8.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.3).
  OpenAPI types do not
  validate actual response shapes; a later extension can add runtime validators.
- `{ type: 'error', error }`: `ApiFailure` with kind http/network/contract/aborted,
  optional status and `errors: AppError[]`. HTTP errors take precedence over
  successful-response validation. Failed JSON parsing is contract; rejected
  AbortError/TimeoutError or a rejected request with an aborted signal is aborted.
  Other transport rejections are network. Failures do not retain raw bodies,
  requests, responses or original exceptions. Status can be absent when upstream
  parsing rejects before returning the response. Cancellation is not retried or
  silently ignored; feature callbacks decide what state/action should follow.

Set `mapErrors(body, response)` once when creating the client to convert your
backend's HTTP errors into `AppError[]`. The default is an empty array because
no backend error envelope is assumed. Its input is the already parsed error
payload (possibly text or undefined); validate external data before using it.
`mapErrors` exceptions propagate, rather than becoming network failures. Existing
`Result<T>` and `AppError` contracts are unchanged.

The pure `ApiEffect<paths, Action>` remains an object: it contains `method`, `url`
and request options, plus `type: 'ApiEffect'`, required `defaultError` and optional
action factories. The handler adapts that description to the client call:

```ts
const effect: Effect = {
  type: 'ApiEffect',
  method: 'get',
  url: '/users/{id}',
  params: { path: { id: 1 } },
  defaultError: {
    code: 'LOAD_FAILED',
    message: 'Could not load user',
    path: [],
  },
  onSuccess: (data) => ({ type: 'LoadedAction', name: data.name }),
  onError: () => ({ type: 'FailedAction' }),
};
```

`onSuccess` receives the endpoint's schema-derived data. `onError` receives
`(errors, failure)`, using the client's nonempty errors or `[defaultError]`.
Both return an action, and the handler awaits dispatch of that action. A missing
onSuccess skips dispatch; a missing onError rejects the failure to the existing
store error reporter. Callback and dispatch exceptions propagate without being
converted to request failures. Effect metadata/callbacks never reach the client.

Request execution, response interpretation and error normalization live in
separate internal helpers; endpoints and the effect handler do not duplicate
HTTP handling. API-client rejections represent unexpected implementation or
mapper errors; expected transport failures use `ApiResult`. Auth/refresh,
automatic retries, CSRF/Origin policy, state management and runtime response
validation are separate application concerns or future extensions.
See the [synthetic example](../../examples/functional-core/README.md).

## API operations and mapped effects

Define a reusable operation in `data/api`, then bind its result to actions in
the reducer. For a schema whose POST `/user` returns
`{ user_id: number; full_name: string; email: string }`:

```ts
import {
  createApiEffect,
  createApiHandler,
  defineApiOperation,
  type ApiEffect,
  type AppError,
} from '@gost-kit/common';
import type { paths } from './schema';

const loadUser = defineApiOperation<paths>()({
  method: 'post',
  url: '/user',
  mapResponse: (dto) => {
    return { id: String(dto.user_id), name: dto.full_name, email: dto.email };
  },
});

type Action =
  | {
      type: 'UserLoadedAction';
      user: { id: string; name: string; email: string };
    }
  | { type: 'UserLoadFailedAction'; errors: AppError[] };
type Operations = typeof loadUser;
type Effect = ApiEffect<paths, Action, Operations>;

const effect: Effect = createApiEffect(loadUser, {
  body: { email: 'ada@example.test' },
  defaultError: {
    code: 'LOAD_FAILED',
    message: 'Could not load user',
    path: [],
  },
  onSuccess: (user) => {
    return { type: 'UserLoadedAction', user };
  },
  onError: (errors) => {
    return { type: 'UserLoadFailedAction', errors };
  },
});

// In a reducer: return { state: loadingState, effects: [effect] }.
// Supply the same shared schema-typed api used by the rest of the application.
const handlers = createApiHandler<paths, Action, Operations>(api);
```

`api` is your configured
`createApiClient<paths>` instance. Keep a named mapper in `data/mappers` when
reused or tested separately. Data/API modules need no feature actions or reducers.
`defineApiOperation` lives in the API layer; `createApiEffect` lives in FC.

`mapResponse` receives the selected endpoint's schema-derived DTO. Its return
value determines `onSuccess`'s argument, including `Awaited` for async mappers.
Omitting `mapResponse` uses identity. JSON null is preserved; 204 and HEAD pass
undefined to the mapper. A mapper is application code, not automatic OpenAPI
runtime validation. Direct `api.request` keeps returning DTOs without mapping.
The client, legacy effects and operation effects all support JSON only;
`parseAs: 'text'`, blob and other formats require a separate API extension.

Construction is pure: no client, mapper, callback or dispatch runs until the
shared handler executes the effect. The result is one ordinary object containing
`type: 'ApiEffect'`, the original `operation`, its method/url, request options,
defaultError and callbacks. Method/url come from the operation. Reducer tests can
check `commit.effects[0].type`, operation identity and request payload.

Add operations to the third generic as `typeof loadUser | typeof updateUser`.
The optional parameter defaults to never: existing two-parameter ApiEffect and
createApiHandler retain their DTO contracts. One handler handles both forms;
its own `operation` property selects mapping. No runtime endpoint registry or
per-feature API client is needed, and effect metadata is removed before request.
If an operation is selected at runtime, narrow it to one operation before calling
createApiEffect (for example, branch on operation.url). Alternatively, construct
the effect in each selection branch. An unresolved union could otherwise pair
one route with another route's options. The handler and RootEffect accept the
union of the resulting correctly constructed effects.

HTTP/network/aborted/contract failures skip the mapper and use the existing
onError path. A mapper throw or rejection becomes `{ kind: 'contract', errors: [] }`:
onError receives `[defaultError]` and can return an action that exits loading
and shows a notification. No status is invented, and client mapErrors is not
called again. Mapper runs even without onSuccess; if it succeeds, dispatch is
skipped. Without onError, a failure rejects to the store reporter. Callback and
dispatch exceptions propagate unchanged. Cancellation during mapping introduces
no extra cancellation protocol; mapper exceptions are contract failures.

See the [working DTO-to-domain example](../../examples/functional-core/src/features/user/data/api/load-user.ts)
and its [mapper](../../examples/functional-core/src/features/user/data/mappers/map-user.ts).
