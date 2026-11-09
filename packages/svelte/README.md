# @gost-kit/svelte

Reactive state for Svelte 5, driven by reducers and effects.
Keep state transitions in TypeScript and read the current state from Svelte
components.

## Install

Requires Node 26.x (`^26.0.0`) for installation/tooling and Svelte
`^5.57.2`. Node is not required in the browser. Use a Svelte build toolchain
that compiles the package's rune modules.

```sh
npm install @gost-kit/svelte @gost-kit/common svelte
```

## Create a store

This counter is a complete component example:

```svelte
<script lang="ts">
  import { createStore } from '@gost-kit/svelte';

  type Action = { type: 'IncrementAction' };

  const counter = createStore<number, Action, never>({
    initState: () => 0,
    reducer: (state) => {
      return { state: state + 1, effects: [] };
    },
    effector: async () => {},
  });

  const increment = () => {
    void counter.dispatch({ type: 'IncrementAction' });
  };
  const reset = () => {
    counter.reset();
  };
</script>

<p>{counter.state}</p>
<button type="button" onclick={increment}>Increment</button>
<button type="button" onclick={reset}>Reset</button>
```

For application-wide state, create the store once at the application's
composition root and provide the same instance to its components.
Reducers, actions and effect handlers come from
[@gost-kit/common](https://www.npmjs.com/package/@gost-kit/common);
the Svelte binding only supplies reactivity.

## State and factories

createStore accepts StoreConfig and returns Store, both public common types.
It replaces the complete state through `$state.raw`; it does not merge state
or deeply proxy it. Each store has independent state. Reducers must return
immutable replacements and preserve unchanged feature references.

initState is a synchronous zero-argument factory, called once at creation and
once per reset. Use a factory per scope and compose the root from them:

```ts
import { define } from '@gost-kit/common';

type UsersState = { names: string[] };
type RootState = { users: UsersState; authenticated: boolean };

const usersState = define.state<UsersState>((options = {}) => {
  return { names: [], ...options };
});
const rootState = define.state<RootState>((options = {}) => {
  return { users: usersState(), authenticated: false, ...options };
});

// Store config: initState: rootState
// Reducer test: rootState({ users: usersState({ names: ['Ada'] }) })
```

Allocate fresh nested defaults on each call. Overrides are shallow and used by
reference; the store does not clone them. `define.state(object)` shares nested
defaults. Primitive/array roots use the same replacement model; class instances
are outside the intended state contract.

## Reset

`store.reset()` restores fresh defaults. For a record with independent scopes,
`store.reset({ excluded: ['auth'] })` keeps the current auth reference and resets
other scopes. A missing/empty list means full reset. The entire root factory
runs, including excluded scopes, followed by one publication.

Excluded values survive only for own keys present in both current and fresh
roots. Missing/inherited keys, including optional scopes added/deleted by
reducers, take their presence/value from the fresh root. Types permit partial
reset for fixed record roots; primitive/array/function/union roots support full
reset only. A union inside a scope is allowed. Runtime cannot detect erased
TypeScript unions.

Reset errors go to onError as `{ kind: 'reset', error }` and do not throw
outward. Validation/factory/read failures occur before writing; a write adapter
can already have side effects when it fails. Initial factory failures throw
during creation, before a store exists. Reset does not cancel effects or ignore
late responses: a later dispatch reads the post-reset state and may populate it
again.

## Feature selectors

Select a feature before computing its presentation:

```ts
const user = $derived(root.state.user);
const view = $derived(userPresenter(user));
```

Here root is the application store and userPresenter is a pure function from
its presenter module. This fragment belongs in a Svelte component/rune module.
When the root is replaced, the selector reevaluates. If the selected reference
is unchanged, Svelte skips the downstream presenter. A direct
`$derived(userPresenter(root.state.user))` depends on root replacements instead.

## Effects and errors

State commits synchronously before effects start. Effects run in parallel;
dispatch waits for them and nested dispatches they await. Reducer/effect errors
are reported and dispatch resolves successfully. onError is synchronous and
not awaited; the default is console reporting, also used if the handler throws.

The store captures config values at creation: replacing initState or onError on
the original config later does not change an existing store. The package ships
rune-bearing JavaScript and declarations, with Svelte as a peer dependency.
Calling createStore requires Svelte compilation, including when the caller is
an ordinary TypeScript module.
