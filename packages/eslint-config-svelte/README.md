# @gost-kit/eslint-config-svelte

Shared Svelte 5 ESLint configuration, including the complete
`@gost-kit/eslint-config` JavaScript/TypeScript baseline. Independently versioned;
consult package.json and CHANGELOG.md for the version. Install alongside
the required peer dependencies.

Requires Node ^26.0.0, ESLint ^10.14.0, TypeScript ^5.9.3 and Svelte ^5.57.2.
The pinned tested combination uses ESLint 10.14.0, TypeScript 5.9.3, Svelte
5.57.2, eslint-plugin-svelte 3.24.0 and svelte-eslint-parser 1.10.1.

## Usage

Install this package, ESLint, TypeScript and Svelte as development dependencies.
The common config comes through this package's dependency. In `eslint.config.mjs`:

```js
import { createSvelteConfig } from '@gost-kit/eslint-config-svelte';
import globals from 'globals';

export default [
  ...(await createSvelteConfig({ tsconfigRootDir: import.meta.dirname })),
  {
    files: ['src/**/*.ts', 'src/**/*.svelte'],
    languageOptions: { globals: globals.browser },
  },
];
```

Install `globals` explicitly if using it. The root must be an absolute consumer
project path. Supply a tsconfig covering authored TypeScript and Svelte files.
Type-aware checks report missing/incompatible projects; plain JavaScript does
not require a tsconfig. Component scripts use TypeScript (`lang="ts"`); components
without a script are permitted. TS/JS rune modules are supported. Globals are
not supplied for browser, Node or test environments: scope them in the consumer.

The asynchronous factory calculates the shared TypeScript policy using public
ESLint APIs. It writes no files, invokes no application code and does not require
a placeholder source file. Config/compiler options remain consumer overrides,
for example `languageOptions.parserOptions.svelteConfig` for component files.
Do not append the common factory again: it is already included.

## Rules and boundaries

The [Svelte rule inventory](RULES.md) records every enabled framework rule and
its options. The [shared inventory](../eslint-config/RULES.md) describes inherited
JS/TS checks; in an installed package consult the README/RULES of
`@gost-kit/eslint-config`. All enabled checks are errors, including in tests.
No blanket test exception or SvelteKit-only rule set is enabled.

Keys are required for each blocks, but upstream `valid-each-key` does not prove
uniqueness/stability or ban index keys. `no-unused-props` supports spread/forwarding;
fixtures verify that forwarding declared props does not produce false positives.
Simple derived suggestions do not establish equivalence of arbitrary effects.
The `no-ignored-unsubscribe` check is syntactic: an ignored direct `.subscribe()`
call is reported even when it belongs to another API with that method name.
Use a documented targeted exception when that API needs no cleanup; the rule does
not establish actual cleanup/lifecycle correctness. `no-store-async` concerns
standard Svelte store callbacks, not application API effects.

Framework-independent correctness, arrow bodies, imports and spacing apply inside
component scripts. Svelte formatting is delegated to Prettier; this config does
not execute the formatter. Use `@gost-kit/prettier-config` with
`prettier-plugin-svelte` in the consuming project's Prettier config.

The bundled `@gost-kit/eslint-plugin` enables
`gost/require-feature-state-selector` on typed components and `.svelte.ts`.
It recognizes public GOST Store state and explicit local `$state.raw` bindings;
select the branch with `$derived` before passing it to a reactive computation.
Simple cases support conservative autofix with V2/V3 name collision suffixes.
See the installed plugin's RULES.md or the [source inventory](../eslint-plugin/RULES.md)
for exact supported forms and limitations. JS-script/stateless components are skipped;
the typed architecture rule is not enabled for `.svelte.js`.

Component state ownership (#16), UI dispatch (#17), boolean conditions (#18),
and derived calculations (#19) remain separate work. Existing `$state.raw`
shell bindings and feature selectors remain valid; the Svelte compiler/type
checker still verifies compilation/accessibility.

## Overrides and verification

Append project overrides after the factory result:

```js
{
  files: ['src/content/RichText.svelte'],
  rules: { 'svelte/no-at-html-tags': 'off' },
}
```

An HTML exception still needs a trusted/sanitized source. The rule itself bans
syntax and does not validate a sanitizer. Keep formatter and linter separate:

```sh
eslint . --fix
prettier . --write
eslint . --max-warnings=0
prettier . --check
```

Some lint errors require manual changes. Upgrade deliberately: inspect changes
in both inherited common policies and the Svelte inventory, run type/component
checks and tests, and review any output diff. Configuration releases remain
independent of runtime package versions. Tests and helper fixtures are excluded
from package artifacts; Svelte is a peer, not an automatically selected UI framework.
