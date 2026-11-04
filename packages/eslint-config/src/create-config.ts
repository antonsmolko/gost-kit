import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import compatibility from 'eslint-config-prettier/flat';
import { importX } from 'eslint-plugin-import-x';
import { defineConfig } from 'eslint/config';
import type { Linter } from 'eslint';
import {
  configurationFiles,
  ignoredFiles,
  javascriptFiles,
  typescriptFiles,
} from './files';
import { sharedRules } from './rules';
import { createTypeScriptPolicy } from './create-typescript-policy';
import type { ConfigOptions } from './types/config-options';

export const createConfig = ({
  tsconfigRootDir,
}: ConfigOptions): Linter.Config[] => {
  const plugins = {
    '@stylistic': stylistic,
    'import-x': importX,
  };

  return defineConfig(
    {
      name: 'gost/ignores',
      ignores: ignoredFiles,
    },
    {
      name: 'gost/javascript',
      files: javascriptFiles,
      extends: [js.configs.recommended, compatibility],
      plugins,
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      rules: sharedRules,
    },
    {
      ...createTypeScriptPolicy({ tsconfigRootDir }),
      name: 'gost/typescript',
      files: typescriptFiles,
    },
    {
      name: 'gost/configuration-default-export',
      files: configurationFiles,
      rules: {
        'import-x/no-default-export': 'off',
      },
    },
  );
};
