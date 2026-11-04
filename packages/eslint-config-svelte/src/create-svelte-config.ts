import { plugin } from '@gost-kit/eslint-plugin';
import { ESLint, type Linter } from 'eslint';
import { createConfig, type ConfigOptions } from '@gost-kit/eslint-config';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import { join } from 'node:path';
import { svelteRules } from './rules';

export const createSvelteConfig = async ({
  tsconfigRootDir,
}: ConfigOptions): Promise<Linter.Config[]> => {
  const shared = createConfig({ tsconfigRootDir });
  const eslint = new ESLint({
    cwd: tsconfigRootDir,
    overrideConfigFile: true,
    overrideConfig: shared,
  });
  const policy: Linter.Config = await eslint.calculateConfigForFile(
    join(tsconfigRootDir, '__gost_svelte_policy__.ts'),
  );

  return [
    { name: 'gost-svelte/ignores', ignores: ['**/.svelte-kit/**'] },
    ...shared,
    ...svelte.configs.base,
    ...svelte.configs.prettier,
    {
      name: 'gost-svelte/typescript-project',
      files: ['**/*.{ts,mts,cts}', '**/*.svelte'],
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
      plugins: Object.fromEntries(
        Object.entries(policy.plugins ?? {}).filter(([name]) => {
          // ESLint owns this plugin; distinct consumer instances have different identities.
          return name !== '@';
        }),
      ),
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
      rules: { 'gost/require-feature-state-selector': 'error' },
    },
    {
      name: 'gost-svelte/selected-rules',
      files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
      rules: svelteRules,
    },
  ];
};
