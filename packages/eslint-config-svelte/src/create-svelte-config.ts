import { plugin } from '@gost-kit/eslint-plugin';
import type { Linter } from 'eslint';
import {
  createConfig,
  createTypeScriptPolicy,
  type ConfigOptions,
} from '@gost-kit/eslint-config';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import { svelteRules } from './rules';

export const createSvelteConfig = async ({
  tsconfigRootDir,
}: ConfigOptions): Promise<Linter.Config[]> => {
  const shared = createConfig({ tsconfigRootDir });
  const policy = createTypeScriptPolicy({ tsconfigRootDir });

  return [
    { name: 'gost-svelte/ignores', ignores: ['**/.svelte-kit/**'] },
    ...shared,
    ...svelte.configs.base,
    ...svelte.configs.prettier,
    {
      name: 'gost-svelte/typescript-project',
      files: ['**/*.{ts,tsx,mts,cts}', '**/*.svelte'],
      languageOptions: { parserOptions: { extraFileExtensions: ['.svelte'] } },
    },
    {
      name: 'gost-svelte/typescript-runes',
      files: ['**/*.svelte.ts'],
      languageOptions: { parser: ts.parser },
    },
    {
      name: 'gost-svelte/component-typescript',
      files: ['**/*.svelte'],
      plugins: policy.plugins,
      rules: policy.rules,
      languageOptions: {
        parserOptions: {
          parser: ts.parser,
          projectService: true,
          tsconfigRootDir,
          extraFileExtensions: ['.svelte'],
        },
      },
    },
    {
      name: 'gost-svelte/architecture',
      files: ['**/*.svelte', '**/*.svelte.ts'],
      plugins: { gost: plugin },
      rules: {
        'gost/require-feature-state-selector': 'error',
        'gost/require-presenter': 'off',
        'gost/ready-boolean-condition': 'off',
      },
    },
    {
      name: 'gost-svelte/selected-rules',
      files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
      rules: svelteRules,
    },
  ];
};
