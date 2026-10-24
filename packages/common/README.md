# @gost/common

Shared TypeScript types, runtime guards and framework-independent functional core.
Unpublished, version 0.0.0. Import through `@gost/common`.

Guard implementation and its URL helper live in `src/sharred/lib`.

```ts
import { createDispatch, guard, reducing, type Nlx, type Reducer } from '@gost/common';

type Action = { type: 'IncrementAction' };
const reducer: Reducer<number, Action, never> = reducing({
  IncrementAction: ({ state }) => ({ state: state + 1 }),
});
```

`define.reducer` and `define.effector` define narrowed handler tables.
`reducing` and `effecting` compose them, rejecting duplicate owners at compile
time. Reducers normalize omitted state/effects into a complete commit.

`define.state` accepts a ready-made plain state object or a factory receiving
one optional options object. Options are constrained to `Partial<TState>` so
overrides keep the corresponding state property types. Factories must handle
a call without options, for example by defaulting their parameter to `{}`.

`define.state(initialState)` accepts a ready-made plain state object and returns
a function taking optional `Partial<TState>` overrides:

```ts
import { define } from '@gost/common';

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

`createDispatch` accepts `reducer`, `effector`, optional `onError`, and
`readState`/`writeState` callbacks. State is committed synchronously before
effects start. Effects start in parallel; dispatch waits for all of them and
for nested dispatches awaited by those effects. Reducer/effect failures are
reported, and dispatch resolves successfully. Reporting failures use a console
fallback. Pending effects or reporters keep dispatch pending.

```ts
let state = 0;
const dispatch = createDispatch<number, Action, never>({
  reducer,
  effector: async () => {},
  readState: () => state,
  writeState: (next) => { state = next; },
});
await dispatch({ type: 'IncrementAction' });
```

This package does not depend on Svelte. The `@gost/svelte` package supplies
reactive state through the same callbacks. Guards check the condition they
name; collection guards do not validate element types. External data still
requires validation of the complete relied-on contract.

Build with `npm run build --workspace @gost/common` from the repository root.
Source imports may omit file extensions and directory `index` names. TypeScript
uses Bundler resolution; `tsc-alias` resolves emitted imports to explicit `.js`
paths for Node.js, including imports in declarations.
Public types have individual source files and are exported from the package
root. The package distributes JavaScript and declarations in `dist`, excluding
tests.
