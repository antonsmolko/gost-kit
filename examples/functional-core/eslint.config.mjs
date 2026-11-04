import { createProjectConfig } from '../../tooling/eslint-config.mjs';
import globals from 'globals';

export default [
  ...(await createProjectConfig(import.meta.dirname, 'src/main.ts')),
  {
    files: ['src/**/*.ts', 'src/**/*.svelte'],
    languageOptions: { globals: globals.browser },
  },
];
