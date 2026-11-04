# @gost-kit/eslint-config

Shared framework-independent JavaScript and TypeScript flat configuration.
Independently versioned; consult package.json and CHANGELOG.md for the version.
Install alongside the required peer dependencies.

Requires Node ^26.0.0, ESLint ^10.14.0 and TypeScript ^5.9.3. The tested baseline
uses ESLint 10.14.0 and TypeScript 5.9.3. No framework parser/plugin or runtime
`@gost-kit/common`/`@gost-kit/svelte` dependency is installed by this package.

## Usage

Install this config, ESLint, TypeScript and any environment globals you use as
devDependencies. In `eslint.config.mjs`:

```js
import { createConfig } from '@gost-kit/eslint-config';
import globals from 'globals';

export default [
  ...createConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.js', '*.config.mjs'],
    languageOptions: { globals: globals.node },
  },
];
```

The absolute `tsconfigRootDir` belongs to the consumer, not the installed package.
Relative roots throw an explicit error. TS files need a discoverable consumer
`tsconfig.json`; Project Service uses their nearest project, including monorepos.
A missing/excluded project file gives a parser diagnostic, not a policy finding.
JS files do not require a tsconfig or type-aware linting.

The base matches `**/*.{js,mjs,cjs}` and `**/*.{ts,mts,cts}` in any directory. It
supplies no browser, Node or test globals. Framework component formats, JSX/TSX
presets, generated-source ignores, aliases and framework rules remain with the
project's additional configuration. No application directory layout is assumed.

## Policies and overrides

All enabled rules are errors, including in tests. The complete resolved list,
options, inherited baseline and disabled compatibility rules are in [RULES.md](RULES.md).
Selected policies include braces, blank lines before if/return, declaration-group
spacing, type imports, merged imports, safe promises and exhaustive switches.
For spacing, const/let/var and all export statements form a declaration group;
adjacent members may remain together, with a blank line before surrounding steps.

Every arrow has a block body. Named exports are required, except in the known
`eslint`, `prettier`, `vite`, `vitest`, `playwright`, `rollup`, and `webpack`
`*.config.{js,mjs,cjs,ts,mts,cts}` files. Default imports remain permitted. Merely
putting a source file in a `config/` directory grants no exception.

Parameters and their properties cannot be assigned. This rule does not detect
all mutation through method calls. Await in loops, ++/-- and for...of are disabled.
A sequential operation must not be made concurrent merely to satisfy a rule.
Necessary exceptions are explicit consumer overrides or targeted disable comments
with a reason; this config grants no blanket test exception.

Append local overrides after the shared config, for example:

```js
{
  files: ['scripts/ordered-migration.ts'],
  rules: { 'no-await-in-loop': 'off' },
}
```

Only intentionally unused arguments starting with `_` are exempt from unused
argument reports. Unused ordinary variables are not exempt merely by naming.
`any` and non-null assertions are errors. Required casts are not globally banned;
`no-unnecessary-type-assertion` reports assertions that do not affect the type.

`node_modules`, `dist`, `coverage`, `test-results` and `playwright-report`
directories are ignored. Add your own generated/framework output ignores with
ESLint's normal flat config. Module aliases and custom resolver settings are
consumer-owned; import merging is tested for the same resolvable module source.

## Prettier and fix workflow

Use `@gost-kit/prettier-config` separately. This ESLint package uses
`eslint-config-prettier` to disable conflicts; it does not run Prettier as a rule.
The selected arrow/braces/padding policies remain enabled after compatibility.

```sh
eslint . --fix
prettier . --write
eslint .
prettier . --check
```

The tested JS/TS fixtures converge: another fix/format pass changes nothing.
Neither command silently configures framework plugins or validates application
behavior. Adopting and formatting an existing project is a separate change.

## Maintenance

Versions are independent of Prettier config and runtime packages. Review the
resolved rule inventory when upgrading pinned presets. Rule/option changes that
reject accepted source or change formatting require a documented breaking-change
assessment; do not silently track new upstream defaults.

Prefer supported upstream rules. When a concrete new custom rule is needed,
create its ESLint plugin with valid/invalid RuleTester cases, exact diagnostics,
and autofix output/idempotence tests if a fix is provided. Do not insert an
untested local rule or require a particular framework/AI tool.

Package tests use common guards only as a development dependency. They and test
helpers are excluded from tarballs; published config execution is independent.
