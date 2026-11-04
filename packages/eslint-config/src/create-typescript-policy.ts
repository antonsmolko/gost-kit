import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import compatibility from 'eslint-config-prettier/flat';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import type { Linter } from 'eslint';
import { isAbsolute } from 'node:path';
import { sharedRules } from './rules';
import { typescriptRules } from './typescript-rules';
import type { ConfigOptions } from './types/config-options';

/** Fully composed TypeScript policy; framework adapters choose files and parser. */
export const createTypeScriptPolicy = ({
  tsconfigRootDir,
}: ConfigOptions): Linter.Config => {
  if (!isAbsolute(tsconfigRootDir)) {
    throw new TypeError(
      'tsconfigRootDir must be an absolute consumer project path.',
    );
  }

  const layers = defineConfig(
    js.configs.recommended,
    tseslint.configs.recommended,
    compatibility,
    {
      plugins: { '@stylistic': stylistic, 'import-x': importX },
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: { ...sharedRules, ...typescriptRules },
    },
  );

  // These owned layers define rules, plugins and language options. Their TS
  // filename selectors do not restrict the policy exported to framework adapters.
  return layers.reduce<Linter.Config>((policy, layer) => {
    return {
      plugins: { ...policy.plugins, ...layer.plugins },
      rules: { ...policy.rules, ...layer.rules },
      languageOptions: {
        ...policy.languageOptions,
        ...layer.languageOptions,
      },
    };
  }, {});
};
