# Gold Standard Kit (GOST Kit)

Reusable application libraries, developed incrementally from real use cases.
Engineering principles and specifications live in
[GOST Spec](https://github.com/antonsmolko/gost-spec).

## Status

`@gost-kit/common` contains shared types, guards and framework-independent functional
core execution. `@gost-kit/svelte` provides its reactive Svelte 5 store binding.

## Development

The initial `0.1.0` release supports Node 26 (`^26.0.0`) for package consumers.
Development, CI and consumer checks use 26.11.1, pinned in `.node-version`.
Runtime packages live under `packages/`. The repository root is private and
cannot be published.

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

The version command removes the changeset entries it has applied. A generated
version PR therefore has updated manifests and changelogs without pending
changesets. `changeset status` checks pending changesets and can exit with code 1
in this state; it is not a publication check or a required gate for version PRs.

After release approval and successful package and example checks, the maintainer
starts the initial release locally from updated `main`:

```sh
npm run release
```

This invokes `changeset publish`, which publishes unpublished versions and creates
package version tags such as `@gost-kit/common@0.1.0`. Each package builds through
its `prepack` hook. After confirming publication, push the generated tags:

```sh
git push --follow-tags
```

Version preparation does not publish. The repository root and example remain private.

The initial release uses `0.1.0` for both packages, with svelte depending
on common through `^0.1.0`.

### Automated releases

On a push to `main`, `.github/workflows/release.yml` first runs the package and
example checks from the reusable `check.yml` workflow. Pull requests run those
checks directly. After successful checks, Changesets Action v2 selects a mode:

- Pending changesets: create or update a release PR using `npm run version:packages`,
  including both lockfiles. Review and merge the release PR to approve the release.
- Unpublished package versions: run `npm run release` and push package version tags.
- No pending changesets or unpublished versions: finish without releasing.

Version and publish jobs share a concurrency group; active release operations
finish before another starts. Main checks run independently for each commit.
The workflow uses the built-in GitHub token and npm OIDC; the publish job alone
receives `id-token: write`. Package releases use their `prepack` builds.

In publish mode, the select-mode action always uploads a publish-plan artifact
with a 30-day retention period. It is available for diagnostics; the publish job
recomputes publication state through Changesets rather than consuming this artifact.

Before the first automated release, complete these settings:

1. In GitHub Settings → Actions → General → Workflow permissions, enable
   **Allow GitHub Actions to create and approve pull requests**. The workflow
   prepares release PRs; the maintainer reviews and merges them.
2. GitHub requires approval for CI runs on PRs created with `GITHUB_TOKEN`.
   Select **Approve workflows to run** on the generated release PR, then review
   its checks before merging. Repeat this approval after each update to the release
   PR, including updates from new changesets merged into `main`.
   No personal access token or GitHub App is required.
3. In each npm package's Settings → Trusted publishing, add GitHub Actions with
   owner `antonsmolko`, repository `gost-kit`, and workflow filename `release.yml`.
   Enable direct publishing with **Allow npm publish**; staging alone does not
   authorize this workflow's publish command. No environment name is used.

Configure npm trust when the next real package release is ready: a new
configuration must complete its first successful publication within two days.
After merging that release PR, verify the registry versions, package tags and
installation from npm. GitHub's **Re-run jobs** retries a failed workflow;
Changesets skips versions already published. The local `npm run release` command
remains available for an approved maintainer-run release.

The workflow is prepared before npm trust is configured. Its version and publish
paths will be verified on the next real package change; no empty release is needed.

References: [Changesets automation](https://changesets.dev/guide/automating),
[GitHub token-triggered checks](https://docs.github.com/en/actions/concepts/security/github_token),
and [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
