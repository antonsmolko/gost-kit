import type { Linter } from 'eslint';
import { join } from 'node:path';
import { createProjectConfig } from './tooling/eslint-config';

const commonRoot = join(import.meta.dirname, 'packages/common');

export default [
  {
    ignores: [
      'examples/**',
      '.superpowers/**',
      '.agents/**',
      '.claude/**',
      '.idea/**',
      'docs-review/**',
    ],
  },
  ...(await createProjectConfig(import.meta.dirname)),
  {
    files: ['packages/common/src/**/*.ts'],
    // These files define the primitives that the rules replace.
    ignores: [
      'packages/common/src/sharred/lib/guard{,.test}.ts',
      'packages/common/src/types/{nlx,ulx,nil}.ts',
    ],
    rules: {
      'gost/prefer-nullish-types': ['error', { commonRoot }],
      'gost/prefer-guard': ['error', { commonRoot }],
    },
  },
  {
    files: ['packages/svelte/src/**/*.ts'],
    rules: {
      'gost/prefer-nullish-types': 'error',
      'gost/prefer-guard': 'error',
    },
  },
] satisfies Linter.Config[];
