# @gost-kit/svelte

Reactive Svelte 5 binding for `@gost-kit/common` functional core.
Requires Node 26 (`^26.0.0`) and Svelte 5.57.2 or later in the 5.x series.
The store implementation lives in `src/shell/domain/createStore.svelte.ts`.

```ts
import { createStore } from '@gost-kit/svelte';

const counter = createStore<number, { type: 'IncrementAction' }, never>({
  initState: () => 0,
  reducer: (state) => ({ state: state + 1, effects: [] }),
  effector: async () => {},
});

await counter.dispatch({ type: 'IncrementAction' });
// counter.state is now 1; reading it in a Svelte template is reactive.
counter.reset();
// counter.state is now 0.
```

`createStore` accepts `StoreConfig` and returns `Store`, both exported from
`@gost-kit/common`. It replaces the complete state through `$state.raw`; it does not
merge or deeply proxy state. Each instance has independent state. Dispatch,
parallel effects, awaited nested dispatch and error reporting are implemented
by `@gost-kit/common` without a framework dependency.

`initState` is a synchronous factory called without arguments once when creating
the store and once per reset. Migrate `initState: initialState()` to
`initState: initialState`. Each scope has its own factory; the root composes them:

```ts
import { define } from '@gost-kit/common';

const usersState = define.state<UsersState>((options = {}) => ({
  data: [],
  errors: [],
  ...options,
}));
const rootState = define.state<RootState>((options = {}) => ({
  users: usersState(),
  auth: authState(),
  ...options,
}));

// In store config: initState: rootState
// In reducer tests: rootState({ users: usersState({ errors: [apiError()] }) })
```

The factories above use application-defined state types and error/auth factories.
Each call should allocate fresh mutable nested defaults. Supplied overrides are
used by reference with a shallow replacement; the store does not clone them.
`define.state(object)` shares nested defaults and cannot guarantee this freshness.

`store.reset()` resets all state. `store.reset({ excluded: ['auth'] })` preserves
the current `auth` reference and resets other scopes. The list is readonly and
checked against root keys, not action namespaces. An absent/empty list is a full
reset. The entire root factory runs even for excluded scopes, followed by a
single state publication. Reset returns void and retains the same store/dispatch.

Partial reset supports fixed object roots with independent scopes. Primitive,
array, function and union roots permit full reset only at the type level; a union
inside a scope is fine. Union detection uses the represented TypeScript type;
type widening or assertions can erase that information. Runtime checks do not
detect unions. Each excluded key must be an own property of both the current and
fresh root, or reset throws TypeError without publishing. This also applies to
optional scopes deleted or added by reducers. A full reset still restores the
factory state. Factory errors propagate synchronously without changing state.

Reset does not cancel pending effects or ignore late responses. A later dispatch
reads the current state after reset and may populate it again. Routing and request
cancellation belong to the application.

The optional `onError` callback is supplied when the store is created, for example
to connect application logging. Replacing it on the original config afterwards
does not change the store's handler.
The same snapshot rule applies to `initState`: replacing it on config does not
change the factory captured by an existing store.

Select a feature before computing its presentation:

```ts
const user = $derived(root.state.user);
const viewState = $derived(userPresenter(user));
```

Replacing the root reevaluates the selection. If `user` retains its reference,
Svelte skips the downstream presenter. Replacing `user` updates its view state.
Keep the selection separate: `$derived(userPresenter(root.state.user))` depends
directly on the root and calls the presenter on unrelated root replacements.

The store keeps one ordinary snapshot, without an additional UI representation.
Root identity follows reducer commits; feature references are preserved by the
reducers. Primitive and array roots keep the same raw replacement model.
Class instances are outside the intended state contract.
Presenters stay pure; reactive bindings belong to components or Svelte adapters.

Reducers still construct immutable root snapshots. Feature selection may rerun
when the root is replaced; an unchanged selected reference does not cause
another presenter call.

The [createStore contract and test cases](docs/createStore.spec.md) describe
the Svelte integration checks; dispatch execution is tested in common.

Build common first, then run `npm run build --workspace @gost-kit/svelte` from the
repository root. Packaging follows the official
[Svelte library packaging guide](https://svelte.dev/docs/kit/packaging) using
`@sveltejs/package`. The `svelte` export condition points to JavaScript containing
runes; consumers compile it with their Svelte tooling. Declarations are shipped
alongside it. Svelte is a peer dependency, and is not bundled into the library.
The `default` condition resolves the same entry for tools without the `svelte`
condition. Calling `createStore` still requires Svelte compilation of the runes.

Source imports omit `.ts` and `.js`, retaining `.svelte` for components and rune
modules. The build resolves emitted paths to `.js` with `tsc-alias`.
