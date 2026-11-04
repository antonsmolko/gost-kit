import { ESLint, type Linter } from 'eslint';
import { createConfig } from '@gost-kit/eslint-config';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import globals from 'globals';
import { join } from 'node:path';

export const createProjectConfig = async (
  root: string,
  typeScriptFile: string,
): Promise<Linter.Config[]> => {
  const shared = createConfig({ tsconfigRootDir: root });
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: shared,
  });
  const policy: Linter.Config = await eslint.calculateConfigForFile(
    join(root, typeScriptFile),
  );

  return [
    { ignores: ['**/.svelte-kit/**'] },
    ...shared,
    ...svelte.configs.base,
    ...svelte.configs.prettier,
    {
      files: ['**/*.{ts,mts,cts}', '**/*.svelte'],
      languageOptions: { parserOptions: { extraFileExtensions: ['.svelte'] } },
    },
    {
      files: ['**/*.svelte.ts'],
      languageOptions: { parser: ts.parser },
    },
    {
      files: ['**/*.svelte'],
      plugins: Object.fromEntries(
        Object.entries(policy.plugins ?? {}).filter(([name]) => {
          return name !== '@';
        }),
      ),
      rules: policy.rules,
      languageOptions: {
        parserOptions: {
          parser: ts.parser,
          projectService: true,
          tsconfigRootDir: root,
          extraFileExtensions: ['.svelte'],
        },
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
