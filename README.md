# Gold Standard Kit (GOST Kit)

Reusable application libraries, developed incrementally from real use cases.
Engineering principles and specifications live in
[GOST Spec](https://github.com/antonsmolko/gost-spec).

## Status

`@gost/common` contains shared types, guards and framework-independent functional
core execution. `@gost/svelte` provides its reactive Svelte 5 store binding.
Neither package has been published yet.

## Development

Use Node 26; `.node-version` pins 26.11.1. Runtime packages will live under
`packages/`. The repository root is private and cannot be published.

Install and verify the packages from the repository root:

```sh
npm ci
npm run build
npm run check
```

Import runtime guards and types through the package's public API:

```ts
import { guard, type DeepPartial, type Result, type Ulx } from '@gost/common';
```

Shared helpers live in `packages/common/src/types`; functional core types and
execution live in `packages/common/src/fc`. Each public type has
its own file. `createDispatch` owns execution and error reporting, while
`@gost/svelte`'s `createStore` supplies reactive state through `$state.raw`.
Both packages expose their public API from the package root and build into
`dist`. See their READMEs for usage. No release tooling is configured yet.

## Examples

[Functional core with a Svelte 5 root store](examples/functional-core/README.md)
shows a component dispatching typed actions, pure state transitions, API effects
and global notifications. It is a private example with its own npm commands
and local dependencies on both workspace packages.
