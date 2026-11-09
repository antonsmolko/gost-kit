# @gost-kit/common

TypeScript types, runtime guards, reducers, effects and a typed API client.
The state and request code works without a frontend framework. Use
[@gost-kit/svelte](https://www.npmjs.com/package/@gost-kit/svelte) to connect
reducers to reactive Svelte state.

## Install

Requires Node 26.x (`^26.0.0`) in your installation/tooling environment.

```sh
npm install @gost-kit/common
```

## Start with a reducer

A reducer takes state and an action, then returns the next state and effects.
Handlers describe transitions; `reducing` turns their table into a reducer.

```ts
import { define, reducing, type Reducer } from '@gost-kit/common';

type State = { count: number };
type Action = { type: 'IncrementAction' };

const handlers = define.reducer<State, Action>()({
  IncrementAction: ({ state }) => {
    return { state: { count: state.count + 1 } };
  },
});
const reducer: Reducer<State, Action, never> = reducing({ root: handlers });

const commit = reducer({ count: 0 }, { type: 'IncrementAction' });
// commit.state: { count: 1 }
// commit.effects: []
```

The reducer does not perform requests or mutate its input. Test it by checking
the returned state and effects directly.

## Types and guards

Import shared types and guards from the package root:

```ts
import { guard, type Nlx } from '@gost-kit/common';

const readName = (value: unknown): Nlx<string> => {
  if (guard.string(value)) {
    return value;
  }

  return null;
};
```

`Ulx<T>`, `Nlx<T>`, `Nil<T>` and `Vdx<T>` describe unions with undefined,
null, null/undefined and void respectively. `JSONValue` and `JSONObject`
describe JSON data, including null and excluding undefined. Function, collection
and object helpers are also exported.

A guard checks the condition it names. Collection guards do not validate their
elements; validate the full contract before using external data. `guard.number`
excludes NaN and Infinity. `safeRun.sync` and `safeRun.async` preserve thrown
Error instances and wrap other values in Error with the original value as cause.

## State factories

Use a factory for each scope and compose them in the root factory. Allocate
fresh nested defaults on every call:

```ts
import { define } from '@gost-kit/common';

type UsersState = { names: string[] };
type RootState = { users: UsersState };

const usersState = define.state<UsersState>((options = {}) => {
  return { names: [], ...options };
});
const rootState = define.state<RootState>((options = {}) => {
  return { users: usersState(), ...options };
});

const initial = rootState();
const withUsers = rootState({ users: usersState({ names: ['Ada'] }) });
```

Factories must accept a call without options. Overrides are shallow and keep
the supplied references, including explicit null/undefined when allowed by the
state type. `define.state(object)` is also supported, but its nested defaults
are shared; it does not produce independent nested objects.

## Compose feature handlers

`define.reducer<TState, TAction, TEffect, TRootState>()` defines a complete
handler table. Effect types default to never. Handlers receive
`({ state, action }, rootState)`; both states are deeply readonly at compile
time. There is no runtime freezing.

`ScopedActions` adds namespaces to feature-local actions. Local actions must
not declare a scope field; that field is reserved for routing.

```ts
import {
  define,
  reducing,
  scope,
  type Reducer,
  type ScopedActions,
} from '@gost-kit/common';

type UsersState = { name: string };
type RootState = { users: UsersState };
type UserAction = { type: 'RenameAction'; name: string };
type Action = ScopedActions<{ users: UserAction }>;

const userHandlers = define.reducer<UsersState, UserAction, never, RootState>()(
  {
    RenameAction: ({ action }) => {
      return { state: { name: action.name } };
    },
  },
);
const reducer: Reducer<RootState, Action, never> = reducing({
  users: scope('users', userHandlers),
});

const commit = reducer(
  { users: { name: '' } },
  { scope: 'users', type: 'RenameAction', name: 'Ada' },
);
```

Feature scopes are required on dispatched actions. Root actions may omit scope
or use `scope: 'root'`. Routing uses `action.scope ?? 'root'`, then action.type;
the action is passed through unchanged. The action namespace and state property
name can differ.

`scope` replaces only its selected property and passes effects through. An
omitted state or the same feature reference preserves the root reference.
`reducing` normalizes omitted state/effects to a complete commit. Give it a
Reducer annotation or explicit generics; without a contract, nonempty maps are
rejected. Use `reducing({})` for never actions.

Missing/optional handlers and literal-map unknown or duplicate keys are rejected.
Structural maps can contain additional keys; object spreads can overwrite keys
before composition sees them. `ExactState` checks nested shapes but compatible
union members can hide extra fields in mixed arrays. `ExactStateStrict` checks
those variants too; it is exported separately and is not used by define.reducer.

## Dispatch and effects

`define.effector<Action, Effect>` defines effect handlers.
`effecting(...tables)` composes a statically known tuple with one handler per
effect type; missing/optional handlers, duplicates and dynamic arrays are rejected.
`effecting()` supports never effects. Effects route by type, without action scopes.

`createDispatch` connects a reducer/effector to readState and writeState callbacks.
Using the reducer from the first example:

```ts
import { createDispatch } from '@gost-kit/common';

let state: State = { count: 0 };
const dispatch = createDispatch<State, Action, never>({
  reducer,
  effector: async () => {},
  readState: () => {
    return state;
  },
  writeState: (next) => {
    state = next;
  },
  onError: (failure) => {
    console.error(failure);
  },
});

await dispatch({ type: 'IncrementAction' });
// state.count: 1
```

State commits synchronously before effects start. Effects run in parallel;
dispatch waits for all of them and for nested dispatches awaited by those effects.
Reducer/effect errors go to synchronous onError; dispatch still resolves
successfully. A pending effect keeps dispatch pending. onError is not awaited;
without it errors go to console. A throwing onError uses a console fallback.

The logger prototype only outputs info; error/warn/trace/debug are currently
no-ops. Do not use those methods as an application error reporter. `logReducer`
includes feature scopes in titles; root actions and effects use plain type names.

## Reset adapters

`createReset({ initState, readState, writeState, onError })` supplies synchronous
reset for a framework adapter. Construction does not initialize state. Each
reset calls initState() without arguments and publishes one fresh root.

`reset({ excluded: ['auth'] })` preserves current own-key values by reference
only when they also exist in the fresh root. Missing/inherited keys are skipped.
The entire factory runs, including excluded scopes. Neither root is mutated;
an empty list means full reset.

Types limit partial reset to fixed record roots with independent scopes.
Primitive/array/function/union roots support full reset; unions inside scopes
are allowed. Runtime checks cannot recover erased TypeScript unions. Non-array
excluded values report TypeError before the factory/state callbacks run.

Reset failures go to onError as `{ kind: 'reset', error }`, without an action,
and do not throw outward. Factory/read/validation failures occur before writing;
a write adapter can already have side effects when it throws. Without onError,
the console reporter is used. Narrow StoreError by kind before accessing action
or effect. Reset does not cancel requests or suppress late dispatches.

## API requests

`createApiClient` wraps openapi-fetch with one response/error policy. Supply an
OpenAPI paths type and a base URL. This small schema illustrates a GET endpoint;
a generated paths type can replace it:

```ts
import { createApiClient } from '@gost-kit/common';

type UserDto = { id: number; full_name: string };
type Paths = {
  '/users/{id}': {
    get: {
      parameters: { path: { id: number } };
      responses: {
        200: { content: { 'application/json': UserDto } };
      };
    };
  };
};

const api = createApiClient<Paths>({ baseUrl: 'https://api.example.test' });
const result = await api.request('get', '/users/{id}', {
  params: { path: { id: 1 } },
});

if (result.type === 'ok') {
  console.log(result.data);
} else {
  console.error(result.error.kind);
}
```

Method, path, required options and successful DTO type come from the schema.
Methods are lowercase. Body and params are separate; there is no arbitrary
response-type generic. Headers, credentials, fetch injection and serializers
follow [openapi-fetch options](https://openapi-ts.dev/openapi-fetch/api).
No browser origin, storage or backend error envelope is assumed.

ApiResult is either `{ type: 'ok', data }` or `{ type: 'error', error }`:

- JSON null is preserved; 204 and HEAD produce undefined. Other successful
  empty/non-JSON responses fail as contract errors. JSON and application/*+json
  media types are accepted. Combined Content-Type values are rejected, even
  identical ones; commas inside quoted parameters are allowed.
- Failure kinds are http, network, contract and aborted, with optional status
  and AppError[]. HTTP errors take precedence over successful-response checks.
  Invalid JSON is contract; rejected AbortError/TimeoutError or a rejection
  with an aborted signal is aborted. Other transport rejections are network.
- Failures do not retain raw bodies, requests, responses or original exceptions.
  Status may be unavailable if parsing fails before returning a response.
- Set mapErrors(body, response) once to convert parsed backend HTTP failures to
  AppError[]. Its default is an empty array. Validate its external input;
  exceptions from mapErrors propagate unchanged.

Only JSON parsing is supported. parseAs text/blob and automatic response-shape
validation are not included. OpenAPI types alone do not validate runtime DTOs.
Authentication, retries and cancellation policy remain application concerns.

## API operations and effects

Define an operation in the data/API layer, then bind its result to actions.
Using Paths and api from the previous example:

```ts
import {
  createApiEffect,
  createApiEffector,
  defineApiOperation,
  effecting,
  type ApiEffect,
  type AppError,
  type Effector,
} from '@gost-kit/common';

const loadUser = defineApiOperation<Paths>()({
  method: 'get',
  url: '/users/{id}',
  mapResponse: (dto) => {
    return { id: String(dto.id), name: dto.full_name };
  },
});

type SuccessAction = {
  type: 'UserLoadedAction';
  user: { id: string; name: string };
};
type ErrorAction = { type: 'UserLoadFailedAction'; errors: AppError[] };
type Action = SuccessAction | ErrorAction;
type Operation = typeof loadUser;
type Effect = ApiEffect<Operation, SuccessAction, ErrorAction>;

const effect: Effect = createApiEffect(loadUser, {
  params: { path: { id: 1 } },
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
const effector: Effector<Action, Effect> = effecting(
  createApiEffector<Paths, Action, Operation>(api),
);
// In a reducer, return { state: loadingState, effects: [effect] }.
```

Construction returns a plain object and performs no request, mapping or dispatch.
The effect holds type ApiEffect, the operation identity, method/url, options and
callbacks. Reducer tests can assert type, operation and payload. Method/url belong
to the operation; data/API modules do not import feature actions.

mapResponse receives the schema DTO; its return type (Awaited for async mapping)
determines onSuccess data. Without a mapper the operation uses identity. JSON
null and 204/HEAD undefined reach the mapper unchanged. Direct api.request still
returns DTOs. Mappers are application code, not automatic runtime validators.

SuccessAction and ErrorAction are checked separately and can each be unions.
Callbacks are optional; use never for an unused role. The factory infers their
results separately. For multiple operations use a union of their typeof types
in ApiEffect and createApiEffector. Narrow a runtime-selected operation before
calling createApiEffect, or construct each effect in its selection branch.
SingleApiOperation preserves one operation and rejects unresolved unions; it
does not narrow values at runtime. The handler table uses define.effector and
is composed with effecting, like other effectors.

Request failures skip mapping. Mapper throws/rejections become contract failures;
onError receives defaultError when the failure has no mapped errors and can
return an action that leaves loading and displays the error. No HTTP status is
invented and mapErrors is not called again. Mapping still runs without onSuccess.
Without onError a failure reaches the store reporter. Callback/dispatch errors
propagate unchanged. Cancellation during mapping adds no extra protocol;
mapper exceptions are contract failures.

See the [working operation](https://github.com/antonsmolko/gost-kit/blob/main/examples/functional-core/src/features/user/data/api/load-user.ts)
and [mapper](https://github.com/antonsmolko/gost-kit/blob/main/examples/functional-core/src/features/user/data/mappers/map-user.ts)
for a complete application example.
