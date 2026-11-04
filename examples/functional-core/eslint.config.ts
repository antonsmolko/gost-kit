import type { Linter } from 'eslint';
import { createProjectConfig } from '../../tooling/eslint-config';
import globals from 'globals';

export default [
  ...(await createProjectConfig(import.meta.dirname)),
  {
    files: ['src/**/*.ts', 'src/**/*.svelte'],
    languageOptions: { globals: globals.browser },
  },
] satisfies Linter.Config[];
