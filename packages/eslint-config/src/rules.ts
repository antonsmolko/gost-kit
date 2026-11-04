import type { Linter } from 'eslint';

export const sharedRules = {
  curly: ['error', 'all'],
  eqeqeq: ['error', 'always'],
  'no-var': 'error',
  'prefer-const': 'error',
  'no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_' }],
  'no-else-return': ['error', { allowElseIf: false }],
  'object-shorthand': ['error', 'always'],
  'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
  'import-x/no-default-export': 'error',
  'arrow-body-style': ['error', 'always'],
  'no-param-reassign': ['error', { props: true }],
  'no-await-in-loop': 'error',
  'no-plusplus': 'error',
  'no-restricted-syntax': [
    'error',
    {
      selector: 'ForOfStatement',
      message:
        'for...of is disabled by the shared policy; use an appropriate alternative or an explicit project override.',
    },
  ],
  '@stylistic/padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: '*', next: 'if' },
    { blankLine: 'always', prev: '*', next: 'return' },
    { blankLine: 'always', prev: ['const', 'let', 'var', 'export'], next: '*' },
    { blankLine: 'always', prev: '*', next: ['const', 'let', 'var', 'export'] },
    {
      blankLine: 'any',
      prev: ['const', 'let', 'var', 'export'],
      next: ['const', 'let', 'var', 'export'],
    },
  ],
} satisfies Linter.RulesRecord;
