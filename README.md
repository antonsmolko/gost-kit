# Gold Standard Kit (GOST Kit)

Reusable application libraries, developed incrementally from real use cases.
Engineering principles and specifications live in
[GOST Spec](https://github.com/antonsmolko/gost-spec).

## Status

`@gost-kit/common` contains shared types, guards and framework-independent functional
core execution. `@gost-kit/svelte` provides its reactive Svelte 5 store binding.
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
import { guard, type DeepPartial, type Result, type Ulx } from '@gost-kit/common';
```

Shared helpers live in `packages/common/src/types`; functional core types and
execution live in `packages/common/src/fc`. Each public type has
its own file. `createDispatch` owns execution and error reporting, while
`@gost-kit/svelte`'s `createStore` supplies reactive state through `$state.raw`.
Both packages expose their public API from the package root and build into
`dist`. See their READMEs for usage.

## Examples

[Functional core with a Svelte 5 root store](examples/functional-core/README.md)
shows a component dispatching typed actions, pure state transitions, API effects
and global notifications. It is a private example with its own npm commands
and local dependencies on both workspace packages.

## Versioning and releases

[Changesets](https://changesets.dev/guide/getting-started) manages independent
versions and changelogs for `@gost-kit/common` and `@gost-kit/svelte`.
For a change that needs a package release, run:

```sh
npm run changeset
```

Select the affected packages, the version bump and a short user-facing summary.
Commit the generated `.changeset/*.md` file with the implementation.
Changes limited to tests, tooling or repository documentation do not need a
changeset unless they affect the distributed package.

To prepare a release, run:

```sh
npm run version:packages
```

This consumes pending changesets, updates package versions and changelogs,
and synchronizes the root and example lockfiles. Review and commit the result
before publishing. Package versions remain independent: a common patch within
svelte's dependency range does not require a svelte release. When common leaves
that range, Changesets updates the dependency and includes a svelte patch release.

After release approval and successful package and example checks, the maintainer
can run `npm run release`. This builds common before svelte, publishes unpublished
versions and creates package version tags. It performs real npm publication;
version preparation does not publish. Push the resulting tags after confirming
publication. The repository root and example remain private.

The first release is planned as `0.1.0` for both packages, with svelte depending
on common through `^0.1.0`. Registry authorization and release automation are
configured separately; no packages have been published yet.
