# Shared TypeScript conventions

Use the public API of `@gost/common` for shared types and runtime guards.
Use `import type` for type-only imports. When importing values and types from
the same module, combine them with inline `type` specifiers, for example
`import { guard, type Ulx } from '@gost/common';`. Reuse an existing type when its semantics match
the required contract, rather than repeating its definition locally. For example,
use `Ulx<T>`, `Nlx<T>`, `Nil<T>` and `Vdx<T>` for the corresponding unions,
and `AnyFn`, `AsyncFn`, `AsyncTap`, `Rec` and other exported helpers where applicable.
Keep standard TypeScript utility types when no common helper adds meaning.
Do not change a domain contract to fit a helper.

Use `guard` methods instead of equivalent direct runtime checks. Preserve exact
semantics: `guard.number` rejects NaN/Infinity, and `guard.record` excludes null
and arrays. Keep defensive `typeof` checks for potentially undeclared globals,
domain-specific comparisons, and checks without an equivalent method.
Type predicates for collections do not validate their elements.

Keep common runtime helpers in `packages/common/src/sharred/lib`. Define guard
methods directly on the `guard` object; compose existing methods when needed
instead of declaring a separate function solely to assign it to a guard property.

The guard implementation and its tests may use primitive checks. Type helper
definitions may use the primitives they encapsulate. Inside `packages/common`,
use relative imports and avoid circular dependencies; elsewhere import through
`@gost/common`. Keep each public type in its own file and re-export it from the
package's public entry point. Generated and third-party code need not be migrated.

Keep framework-independent functional core types, handler composition and dispatch
execution in `packages/common/src/fc`. Put Svelte reactivity bindings
in `packages/svelte/src/shell/domain` and consume them through `@gost/svelte`. The common package
must not depend on Svelte. Examples consume both packages through their public APIs.

Keep test files next to the implementation they cover. Exclude tests and test-only
helpers from distributed package artifacts.

Use descriptive generic parameter names, such as `TState`, `TAction`, `TEffect`
and `TStateOptions`, instead of single-letter names for application contracts.
