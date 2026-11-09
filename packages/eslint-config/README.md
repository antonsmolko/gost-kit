# @gost-kit/eslint-config

ESLint configuration for JavaScript and TypeScript. It checks types, promises,
imports and code structure. Formatting runs separately through Prettier.

## Install

Requires Node 26.x (`^26.0.0`), ESLint `^10.14.0` and TypeScript `^5.9.3`.
The example uses jiti to load a TypeScript ESLint config, and globals to declare
browser globals. @types/node supplies types for the config’s Node APIs.

```sh
npm install -D @gost-kit/eslint-config eslint typescript jiti globals @types/node
```

## Configure

Create `eslint.config.ts` at your project root:

```ts
import { createConfig } from '@gost-kit/eslint-config';
import globals from 'globals';

export default [
  ...createConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
];
```

TypeScript files must belong to a discoverable tsconfig. For a new project,
this is a minimal `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "eslint.config.ts"]
}
```

```sh
npx eslint .
npx eslint . --fix
```

Existing projects should use their own compiler options. Include TSX files
and a suitable jsx setting when needed. The absolute tsconfigRootDir is the
consumer project root; relative roots are rejected. Project Service finds the
nearest project. Missing/excluded TypeScript files produce parser errors.
JavaScript/JSX does not require a TypeScript project.

## Rules and overrides

The complete rule list and options are in [RULES.md](RULES.md).
Enabled rules are errors, including in tests. The configuration covers
js/jsx/mjs/cjs and ts/tsx/mts/cts files, without imposing an application layout.

Policies include braces, block-bodied arrows, spacing before if/return, type
imports, merged imports, safe promises and exhaustive switches. Adjacent
declarations/exports may form a group. Named exports are required except in
known eslint/prettier/vite/vitest/playwright/rollup/webpack config files;
default imports remain allowed.

Parameters/properties cannot be assigned. This does not prove the absence of
mutation through methods. await in loops, ++/-- and for...of are reported;
keep necessary sequential work explicit with a targeted override. Only unused
arguments prefixed with an underscore are exempt; ordinary variables are not.
any and non-null assertions are errors. Necessary type assertions are permitted.

Append overrides after createConfig:

```ts
{
  files: ['scripts/ordered-migration.ts'],
  rules: { 'no-await-in-loop': 'off' },
}
```

This is an additional array entry in eslint.config.ts. Projects own environment
globals, aliases/resolvers, framework presets and generated-source ignores.
node_modules, dist, coverage, test-results and playwright-report are ignored.
No blanket test exception is applied.

## Prettier

The config disables conflicting rules with eslint-config-prettier. It does not
run Prettier as an ESLint rule. Install
[@gost-kit/prettier-config](https://www.npmjs.com/package/@gost-kit/prettier-config)
separately, then use:

```sh
npx eslint . --fix
npx prettier . --write
npx eslint . --max-warnings=0
npx prettier . --check
```

## Framework adapters

createTypeScriptPolicy({ tsconfigRootDir }) returns the same composed rules,
plugins and TypeScript parser options without file selectors. An adapter chooses
its files/parser and retains framework options. For Svelte, use
[@gost-kit/eslint-config-svelte](https://www.npmjs.com/package/@gost-kit/eslint-config-svelte),
which already includes this baseline.

The default import resolver is included upstream. If configuring the legacy
eslint-import-resolver-node fallback, install that optional peer yourself.
