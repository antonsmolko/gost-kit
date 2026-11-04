import type { ESLint } from 'eslint';
import { requireFeatureStateSelector } from './rules/require-feature-state-selector';

export const plugin: ESLint.Plugin = {
  meta: { name: '@gost-kit/eslint-plugin' },
  // typescript-eslint still types the legacy context members removed in ESLint 10.
  // At this public boundary the implementation uses only the current APIs.
  rules: {
    'require-feature-state-selector':
      requireFeatureStateSelector as unknown as NonNullable<
        ESLint.Plugin['rules']
      >[string],
  },
};
