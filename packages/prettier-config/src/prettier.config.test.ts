import { expect, test } from 'vitest';
import { format } from 'prettier';
import config from './prettier.config';

test('exports exactly the owner-selected formatting options', () => {
  expect(config).toEqual({
    tabWidth: 2,
    useTabs: false,
    singleQuote: true,
    semi: true,
    trailingComma: 'all',
    printWidth: 80,
    arrowParens: 'always',
    endOfLine: 'lf',
    objectWrap: 'preserve',
  });
});

test('formats JS/TS consistently and converges without framework plugins', async () => {
  const formatted = await format(
    'export const name=(value:string)=>{return "Hello "+value}\r\n',
    {
      ...config,
      parser: 'typescript',
    },
  );

  expect(formatted).toContain("'Hello '");
  expect(formatted).toContain('(value: string) =>');
  expect(formatted).not.toContain('\r');
  expect(formatted.endsWith(';\n')).toBe(true);
  expect(await format(formatted, { ...config, parser: 'typescript' })).toBe(
    formatted,
  );
});

test('preserves deliberately multiline objects and permits local overrides', async () => {
  const multiline = await format('export const item = {\nname: "Ada",\n};', {
    ...config,
    parser: 'typescript',
  });
  const overridden = await format('export const name="Ada";', {
    ...config,
    singleQuote: false,
    parser: 'typescript',
  });

  expect(multiline).toContain("{\n  name: 'Ada',\n}");
  expect(overridden).toContain('"Ada"');
});
