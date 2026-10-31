# @gost-kit/svelte

Reactive Svelte 5 binding for `@gost-kit/common` functional core.
Unpublished, version 0.0.0. Requires Svelte 5.57.2 or later in the 5.x series.
The store implementation lives in `src/shell/domain/createStore.svelte.ts`.

```ts
import { createStore } from '@gost-kit/svelte';

const counter = createStore<number, { type: 'IncrementAction' }, never>({
  initState: 0,
  reducer: (state) => ({ state: state + 1, effects: [] }),
  effector: async () => {},
});

await counter.dispatch({ type: 'IncrementAction' });
// counter.state is now 1; reading it in a Svelte template is reactive.
```

`createStore` accepts `StoreConfig` and returns `Store`, both exported from
`@gost-kit/common`. It replaces the complete state through `$state.raw`; it does not
merge or deeply proxy state. Each instance has independent state. Dispatch,
parallel effects, awaited nested dispatch and error reporting are implemented
by `@gost-kit/common` without a framework dependency.

The optional `onError` callback is supplied when the store is created, for example
to connect application logging. Replacing it on the original config afterwards
does not change the store's handler.

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
reducers. Primitive, array and class roots keep the same raw replacement model.
Presenters stay pure; reactive bindings belong to components or Svelte adapters.

Reducers still construct immutable root snapshots. Feature selection may rerun
when the root is replaced; tests verify that an unchanged selected reference
does not cause another presenter call.

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
