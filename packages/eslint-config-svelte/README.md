# @gost-kit/eslint-config-svelte

ESLint configuration for Svelte 5. Includes the JavaScript/TypeScript rules from
@gost-kit/eslint-config, Svelte parsing and the GOST architecture plugin.

## Install

Requires Node 26.x (`^26.0.0`), ESLint `^10.14.0`, TypeScript `^5.9.3`
and Svelte `^5.57.2`. jiti loads the TypeScript ESLint config; globals supplies
browser global names. @types/node supplies types for the config's Node APIs.

```sh
npm install -D @gost-kit/eslint-config-svelte eslint typescript jiti globals @types/node
```

Install Svelte in the application if it is not already present. The base config
and Svelte parser/plugins are dependencies of this package; do not append the
base createConfig again.

## Configure

Create `eslint.config.ts`:

```ts
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

Use the application's tsconfig, covering TypeScript and Svelte sources. For a
small standalone example, `tsconfig.json` can be:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", "eslint.config.ts"]
}
```

```sh
npx eslint .
npx eslint . --fix
```

The root must be an absolute consumer path. Missing/incompatible TypeScript
projects produce errors. Component scripts use lang="ts"; scriptless components
and TS/JS rune modules are supported. Ordinary JavaScript does not require a
tsconfig. Scope Node/test globals and generated ignores in project overrides.
Framework compiler options can be supplied through parserOptions.svelteConfig.

## Rules

[Svelte rules and options](RULES.md) are shipped with this package. Inherited
JS/TS policies are documented in the
[base rule inventory](https://github.com/antonsmolko/gost-kit/blob/main/packages/eslint-config/RULES.md).
All enabled rules are errors, including in tests.

The bundled GOST rules have these defaults:

| Rule                                | Default | Purpose                                                            |
| ----------------------------------- | ------- | ------------------------------------------------------------------ |
| gost/require-feature-state-selector | error   | Select a replaceable state branch before a reactive computation.   |
| gost/no-component-state             | off     | Keep business-component state in root/feature state.               |
| gost/single-intent-dispatch         | off     | Forward one intent per UI handler.                                 |
| gost/ready-boolean-condition        | off     | Read ready booleans in if/else-if conditions.                      |
| gost/require-presenter              | off     | Move visible derived/template calculations into presenter modules. |

The selector checks typed components and .svelte.ts, using common Store
provenance or explicit local $state.raw. JS-script/stateless components are
skipped; mixed components check typed scripts only. Typed template const
computations report without autofix; simple derived cases support conservative
autofix. These defaults are not enabled for .svelte.js.

## Business-component overrides

Enable the policies you want and exclude independent UI-Kit components:

```ts
{
  files: ['src/**/*.svelte'],
  rules: {
    'gost/no-component-state': 'error',
    'gost/single-intent-dispatch': 'error',
    'gost/ready-boolean-condition': 'error',
    'gost/require-presenter': 'error',
  },
},
{
  files: ['src/ui-kit/**/*.svelte'],
  rules: {
    'gost/no-component-state': 'off',
    'gost/single-intent-dispatch': 'off',
    'gost/ready-boolean-condition': 'off',
    'gost/require-presenter': 'off',
  },
}
```

Append these entries after the factory result. Paths are illustrative; other
Svelte/TypeScript checks retain their levels. Boolean reads require typed parser
services and strictNullChecks. Presenter calls are recognized by TypeScript
declaration provenance in *.presenter.ts or emitted *.presenter.d.ts modules.
These checks do not prove presenter purity or detect every mutation/browser API.

The [GOST rule inventory](https://github.com/antonsmolko/gost-kit/blob/main/packages/eslint-plugin/RULES.md)
covers diagnostics, parser requirements, autofix limits and known exclusions.

## Boundaries and formatting

Each blocks require keys, but uniqueness/stability and index keys need review.
Ignored direct subscribe calls report syntactically, including unrelated APIs
with that name. A rule does not prove lifecycle cleanup. Raw HTML needs trusted
or sanitized input even when its syntax is permitted by a local override.
Svelte compiler/type checks remain necessary for compilation and accessibility.

Formatting is separate. Use
[@gost-kit/prettier-config](https://www.npmjs.com/package/@gost-kit/prettier-config)
with prettier-plugin-svelte, then run ESLint fix, Prettier write and both checks.
