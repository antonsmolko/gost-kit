import type { Linter } from 'eslint';
import { createSvelteConfig } from '@gost-kit/eslint-config-svelte';
import globals from 'globals';

export const createProjectConfig = async (
  root: string,
): Promise<Linter.Config[]> => {
  return [
    ...(await createSvelteConfig({ tsconfigRootDir: root })),
    {
      files: ['src/**/*.svelte'],
      rules: {
        'gost/no-component-state': 'error',
        'gost/single-intent-dispatch': 'error',
      },
    },
    {
      files: [
        '**/*.{js,mjs,cjs}',
        '**/*.config.ts',
        '**/scripts/**/*.ts',
        '**/*.test.ts',
        '**/e2e/**/*.ts',
      ],
      languageOptions: { globals: globals.node },
    },
    {
      files: ['**/src/**/*.svelte', '**/src/**/*.svelte.ts'],
      languageOptions: { globals: globals.browser },
    },
  ];
};
