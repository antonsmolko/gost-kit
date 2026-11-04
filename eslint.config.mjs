import { createProjectConfig } from './tooling/eslint-config.mjs';

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
];
