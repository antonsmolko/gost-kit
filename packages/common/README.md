# @gost-kit/common

Shared TypeScript types, runtime guards and framework-independent functional core.
Unpublished, version 0.0.0. Import through `@gost-kit/common`.

Guard implementation and its URL helper live in `src/sharred/lib`.

`JSONValue` and `JSONObject` are exported from the public API. They describe
recursive JSON primitives, arrays and string-keyed objects, including `null`
and excluding `undefined`.

```ts
import { createDispatch, guard, reducing, type Nlx, type Reducer } from '@gost-kit/common';

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
  writeState: (next) => { state = next; },
  onError: (failure) => { console.error(failure); },
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
