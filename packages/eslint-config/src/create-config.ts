import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import compatibility from 'eslint-config-prettier/flat';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import type { Linter } from 'eslint';
import { isAbsolute } from 'node:path';
import {
  configurationFiles,
  ignoredFiles,
  javascriptFiles,
  typescriptFiles,
} from './files';
import { sharedRules } from './rules';
import { typescriptRules } from './typescript-rules';
import type { ConfigOptions } from './types/config-options';

export const createConfig = ({
  tsconfigRootDir,
}: ConfigOptions): Linter.Config[] => {
  if (!isAbsolute(tsconfigRootDir)) {
    throw new TypeError(
      'tsconfigRootDir must be an absolute consumer project path.',
    );
  }

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
      rules: sharedRules,
    },
    {
      name: 'gost/typescript',
      files: typescriptFiles,
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        compatibility,
      ],
      plugins,
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        ...sharedRules,
        ...typescriptRules,
      },
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
