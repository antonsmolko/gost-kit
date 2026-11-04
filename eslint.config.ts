import type { Linter } from 'eslint';
import { createProjectConfig } from './tooling/eslint-config';

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
  ...(await createProjectConfig(
    import.meta.dirname,
    'packages/common/src/index.ts',
  )),
] satisfies Linter.Config[];
