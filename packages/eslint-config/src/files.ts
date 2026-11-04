export const javascriptFiles = ['**/*.{js,mjs,cjs}'];
export const typescriptFiles = ['**/*.{ts,mts,cts}'];

export const configurationFiles = [
  '**/{eslint,prettier,vite,vitest,playwright,rollup,webpack}.config.{js,mjs,cjs,ts,mts,cts}',
];

export const ignoredFiles = [
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
  '**/test-results/**',
  '**/playwright-report/**',
];
