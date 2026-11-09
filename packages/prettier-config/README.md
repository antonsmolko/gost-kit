# @gost-kit/prettier-config

Prettier settings with two-space indentation, single quotes and semicolons.
Use the same formatting options across projects; add language plugins where needed.

## Install

Requires Node 26.x (`^26.0.0`) and Prettier `^3.9.10`.

```sh
npm install -D @gost-kit/prettier-config prettier
```

## Configure

Create `prettier.config.ts`. Node 26 loads this TypeScript config directly:

```ts
export { default } from '@gost-kit/prettier-config';
```

```sh
npx prettier . --write
npx prettier . --check
```

Use --write locally and --check in CI. Projects own their .prettierignore and
generated-source policy.

## Settings and overrides

| Option        | Value    |
| ------------- | -------- |
| tabWidth      | 2        |
| useTabs       | false    |
| singleQuote   | true     |
| semi          | true     |
| trailingComma | all      |
| printWidth    | 80       |
| arrowParens   | always   |
| endOfLine     | lf       |
| objectWrap    | preserve |

printWidth guides wrapping; it is not a hard maximum. objectWrap preserves
deliberately multiline objects without forcing every short object to wrap.
Other options use Prettier defaults.

To override an option, replace the config with:

```ts
import config from '@gost-kit/prettier-config';

export default {
  ...config,
  printWidth: 100,
};
```

## Svelte

Install the language plugin separately:

```sh
npm install -D prettier-plugin-svelte
```

Then use this prettier.config.ts:

```ts
import config from '@gost-kit/prettier-config';

export default {
  ...config,
  plugins: ['prettier-plugin-svelte'],
};
```

Use [@gost-kit/eslint-config](https://www.npmjs.com/package/@gost-kit/eslint-config)
or its Svelte adapter for correctness, braces, arrow bodies and blank-line
policies. Run ESLint --fix before Prettier --write, then both read-only checks.
Prettier alone does not enforce those lint policies.
