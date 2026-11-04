# @gost-kit/prettier-config

Shared framework-independent Prettier settings, independently versioned.
Consult package.json and CHANGELOG.md for the version. Install this package
alongside the required Prettier peer dependency.

Requires Node ^26.0.0 and Prettier ^3.9.10; tested with Prettier 3.9.10.
No language/framework plugin is included.

## Usage

Install this package and Prettier as devDependencies. In `prettier.config.mjs`:

```js
export { default } from '@gost-kit/prettier-config';
```

Or extend it explicitly:

```js
import config from '@gost-kit/prettier-config';

export default {
  ...config,
  printWidth: 100,
};
```

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

`printWidth` guides wrapping and is not a hard maximum. `objectWrap: preserve`
keeps deliberately multiline objects; it does not force every short object onto
multiple lines. Other options use the pinned tested Prettier baseline's defaults.

Run `prettier . --check` in CI and `prettier . --write` to format. Projects own
ignore files, generated-source policy and any framework plugin. This package
never walks files or modifies an application when imported.

Use `@gost-kit/eslint-config` for the separately agreed braces, arrow bodies,
blank lines and correctness policies. The tested fix sequence is ESLint fix,
Prettier write, then both read-only checks. Config versions remain independent;
review output changes and changelog before upgrading a project.
