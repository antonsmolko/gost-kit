# GOST architecture rules

## gost/require-feature-state-selector

Select an immutable reactive branch before passing it to a computation in
`$derived` or the synchronous callback of `$derived.by`:

```ts
// Reported; a simple standalone declaration can be fixed with eslint --fix.
const view = $derived(userPresenter(root.state.user));

// Correct.
const user = $derived(root.state.user);
const view = $derived(userPresenter(user));
```

`root` is not a special name. The rule recognizes the declaration provenance of
`Store.state` from the public `@gost-kit/common` API, including aliases,
reexports, inferred `createStore` returns, nullable Store and supported mapped
or intersection types preserving that provenance. It does not identify Store
solely by its name or structural assignability. Mixed unions and any/unknown
are not assumed to be Store.

A directly declared local `$state.raw` also represents a replaceable snapshot:

```ts
let model = $state.raw({ user: { name: 'Ada' } });
const user = $derived(model.user);
const view = $derived(userPresenter(user));
```

A plain `const snapshot = model` captures the current raw snapshot and is not
itself a reactive alias. Ordinary objects, deep-proxy `$state` and ordinary
functions named `$state`/`$derived` are not automatically subject to this rule.
TypeScript types alone cannot prove Svelte reactivity: both state runes return
`T`. `$state.raw` detection therefore inspects original variable bindings.

### Diagnostic scope

Direct reads used in call arguments or receivers inside reactive expressions
are reported, including multiple branches, method chains, static bracket keys,
optional calls/access, and passing an entire `Store.state` snapshot.
Selectors without a computation call remain valid, including `$derived.by`
selectors. Event handlers and other nonreactive reads are outside the rule.
Callbacks passed as values are not assumed to run synchronously; the explicit
`$derived.by` callback is inspected. Helpers, arbitrary returned reactive values,
aliased snapshots, dynamic state keys and dependencies hidden across modules
are not traced. No claim of complete interprocedural analysis or presenter
purity is made.

### Autofix

Autofix handles a standalone top-level derived declaration in a rune module or
component instance script, with a single direct function call and one immediate
feature-field argument. A selector is inserted immediately before the declaration.
The final field supplies the name; occupied names use `V2`, `V3`, etc. Imports,
later declarations and references visible from outer scopes are considered.
Repeated fixing does not add selectors.

Complex `$derived.by`, nested declarations, multiple inputs/declarators,
receivers, optional/dynamic access, deeper property/getter paths, conditional
arguments, spreads and exported declarations retain diagnostics without fixes.
Fixes preserve surrounding comments and line endings; Prettier can then normalize
layout. The normal derived contract still requires pure computations.

Separate selection lets Svelte skip downstream updates when the feature's value
is referentially unchanged. It does not make a mutable feature immutable or
prevent recomputation when the selected feature actually changes.

Sources: [Svelte update propagation](https://svelte.dev/docs/svelte/$derived#Update-propagation),
[Svelte state](https://svelte.dev/docs/svelte/$state),
[typed ESLint rules](https://typescript-eslint.io/developers/custom-rules/).
