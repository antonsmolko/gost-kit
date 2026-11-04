import type { Config } from 'prettier';

const config = {
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 80,
  arrowParens: 'always',
  endOfLine: 'lf',
  objectWrap: 'preserve',
} satisfies Config;

export default config;
