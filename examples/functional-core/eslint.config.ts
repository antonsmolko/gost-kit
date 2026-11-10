import type { Linter } from 'eslint';
import { createProjectConfig } from '../../tooling/eslint-config';
import globals from 'globals';

export default [
  ...(await createProjectConfig(import.meta.dirname)),
  {
    files: ['src/**/*.ts', 'src/**/*.svelte'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/ui-kit/**/*.svelte'],
    rules: {
      'gost/no-component-state': 'off',
      'gost/single-intent-dispatch': 'off',
      'gost/ready-boolean-condition': 'off',
      'gost/require-presenter': 'off',
    },
  },
] satisfies Linter.Config[];
