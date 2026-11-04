import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { ESLint } from 'eslint';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { format } from 'prettier';
import prettierConfig from '@gost-kit/prettier-config';
import globals from 'globals';
import { guard } from '@gost-kit/common';
import { createConfig } from './index';

let root: string;
let eslint: ESLint;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'gost-tooling-'));
  await writeFile(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ES2024',
        module: 'ESNext',
        moduleResolution: 'Bundler',
      },
      include: ['**/*.ts', '**/*.mts', '**/*.cts'],
    }),
  );
  await writeFile(
    join(root, 'types.ts'),
    "export type User = { name: string };\nexport const token = 'hello';\n",
  );
  eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: createConfig({ tsconfigRootDir: root }),
  });
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

const lint = async (
  source: string,
  filename = 'case.ts',
  instance = eslint,
) => {
  const filePath = join(root, filename);

  await writeFile(filePath, source);

  const [result] = await instance.lintText(source, { filePath });

  expect(result).toBeDefined();
  expect(result.fatalErrorCount).toBe(0);

  return result;
};

const cases = [
  ['E01', 'no-debugger', 'debugger;', 'js'],
  [
    'E02',
    'curly',
    'export const f = (value: boolean) => { if (value) return 1; };',
    'ts',
  ],
  [
    'E03',
    'eqeqeq',
    'export const f = (value: number) => { return value == 1; };',
    'ts',
  ],
  ['E04-var', 'no-var', 'export var value = 1;', 'ts'],
  [
    'E04-const',
    'prefer-const',
    'export const f = () => { let value = 1;\n\nreturn value; };',
    'ts',
  ],
  [
    'E05',
    '@typescript-eslint/no-unused-vars',
    'export const f = (unused: number, value: number) => { return value; };',
    'ts',
  ],
  [
    'E06',
    'no-else-return',
    'export const f = (value: boolean) => { if (value) { return 1; } else { return 0; } };',
    'ts',
  ],
  [
    'E07',
    'object-shorthand',
    'const value = 1;\n\nexport const result = { value: value };',
    'ts',
  ],
  [
    'E08-types',
    '@typescript-eslint/consistent-type-imports',
    "import { User } from './types';\n\nexport const f = (value: User) => { return value.name; };",
    'ts',
  ],
  [
    'E08-side-effects',
    '@typescript-eslint/no-import-type-side-effects',
    "import { type User } from './types';\n\nexport const f = (value: User) => { return value.name; };",
    'ts',
  ],
  [
    'E09',
    'import-x/no-duplicates',
    "import { token } from './types';\nimport type { User } from './types';\n\nexport const f = (value: User) => { return token + value.name; };",
    'ts',
  ],
  [
    'E10',
    '@stylistic/padding-line-between-statements',
    'export const f = (value: boolean) => {\nvoid value;\nif (value) { return 1; }\n\nreturn 0;\n};',
    'ts',
  ],
  [
    'E11',
    '@stylistic/padding-line-between-statements',
    'export const f = () => {\nvoid 0;\nreturn 1;\n};',
    'ts',
  ],
  [
    'E12',
    '@stylistic/padding-line-between-statements',
    'export const f = () => {\nconst value = 1;\nvoid value;\n};',
    'ts',
  ],
  [
    'T01',
    '@typescript-eslint/no-explicit-any',
    'export const value: any = 1;',
    'ts',
  ],
  [
    'T02',
    '@typescript-eslint/no-floating-promises',
    'Promise.resolve(1);',
    'ts',
  ],
  [
    'T03',
    '@typescript-eslint/no-misused-promises',
    '[1].forEach(async () => { await Promise.resolve(); });',
    'ts',
  ],
  [
    'T04',
    '@typescript-eslint/await-thenable',
    'export const f = async () => { await 1; };',
    'ts',
  ],
  [
    'T05',
    '@typescript-eslint/switch-exhaustiveness-check',
    "export const f = (value: 'a' | 'b') => { switch (value) { case 'a': return 1; } };",
    'ts',
  ],
  [
    'T06',
    '@typescript-eslint/no-unnecessary-type-assertion',
    'export const f = (value: string) => { return value as string; };',
    'ts',
  ],
  [
    'T07',
    '@typescript-eslint/no-non-null-assertion',
    'declare const value: string | undefined;\n\nexport const text = value!;',
    'ts',
  ],
  ['A01', 'arrow-body-style', 'export const value = () => 1;', 'ts'],
  ['A02', 'import-x/no-default-export', 'export default 1;', 'ts'],
  [
    'A03',
    'no-param-reassign',
    "export const change = (value: { name: string }) => { value.name = 'Ada'; };",
    'ts',
  ],
  [
    'A04',
    'no-await-in-loop',
    'export const run = async () => { for (let i = 0; i < 2; i += 1) { await Promise.resolve(); } };',
    'ts',
  ],
  ['A05', 'no-plusplus', 'export let count = 0;\n\ncount++;', 'ts'],
  [
    'A06',
    'no-restricted-syntax',
    'for (const item of [1]) { void item; }',
    'ts',
  ],
] as const;

describe.each(cases)('%s', (_policy, ruleId, source, extension) => {
  test('reports the expected rule as an error, without parser failures', async () => {
    const result = await lint(source, `case.${extension}`);

    expect(result.messages).toContainEqual(
      expect.objectContaining({ ruleId, severity: 2 }),
    );
  });
});

test('valid TS, declarations, grouped constants and underscore arguments pass', async () => {
  const result = await lint(
    "export type User = { name: string };\n\nexport const name = (_unused: number, user: User) => {\n  const value = user.name;\n  const empty = '';\n\n  if (value === empty) {\n    return 'Anonymous';\n  }\n\n  return value;\n};\n",
  );

  expect(result.messages).toEqual([]);
});

test('ordinary JS does not require a tsconfig or TypeScript parser service', async () => {
  const project = join(root, 'javascript-only');

  await mkdir(project);

  const instance = new ESLint({
    cwd: project,
    overrideConfigFile: true,
    overrideConfig: createConfig({ tsconfigRootDir: project }),
  });
  const [result] = await instance.lintText(
    'export const read = (value) => { return value; };',
    { filePath: join(project, 'code.js') },
  );

  expect(result.messages).toEqual([]);
});

test.each([
  'eslint',
  'prettier',
  'vite',
  'vitest',
  'playwright',
  'rollup',
  'webpack',
])('permits default exports in %s configuration files only', async (tool) => {
  const result = await lint('export default {};', `${tool}.config.js`);

  expect(result.messages).toEqual([]);
});

test('test files retain all selected errors, including non-null assertions', async () => {
  const result = await lint(
    'declare const value: string | undefined;\n\nexport const text = value!;',
    'example.test.ts',
  );

  expect(result.messages).toContainEqual(
    expect.objectContaining({
      ruleId: '@typescript-eslint/no-non-null-assertion',
      severity: 2,
    }),
  );
});

test('environments and rule overrides belong to the consumer', async () => {
  const source = 'export const platform = process.platform;';
  const missing = await lint(source, 'script.js');
  const custom = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      ...createConfig({ tsconfigRootDir: root }),
      {
        files: ['**/*.js'],
        languageOptions: { globals: globals.node },
        rules: { eqeqeq: 'off' },
      },
    ],
  });
  const configured = await lint(source, 'script.js', custom);
  const overridden = await lint(
    'export const equal = (value) => { return value == 1; };',
    'compare.js',
    custom,
  );

  expect(missing.messages).toContainEqual(
    expect.objectContaining({ ruleId: 'no-undef' }),
  );
  expect(configured.messages).toEqual([]);
  expect(overridden.messages).toEqual([]);
});

test('type-aware TS without a consumer tsconfig fails explicitly', async () => {
  const project = join(root, 'missing-config');

  await mkdir(project);
  await writeFile(join(project, 'code.ts'), 'export const value = 1;');

  const instance = new ESLint({
    cwd: project,
    overrideConfigFile: true,
    overrideConfig: createConfig({ tsconfigRootDir: project }),
  });
  const [result] = await instance.lintText('export const value = 1;', {
    filePath: join(project, 'code.ts'),
  });

  expect(result.fatalErrorCount).toBe(1);
  expect(result.messages[0].message).toMatch(/project service|tsconfig/i);
});

test('factory requires an explicit absolute consumer root', () => {
  expect(() => {
    return createConfig({ tsconfigRootDir: '.' });
  }).toThrow(/absolute/i);
});

test('autofixes and Prettier converge, including merged value/type imports', async () => {
  const source =
    "import { token } from './types';\nimport type { User } from './types';\nexport const name = (user: User) => token + user.name;";
  const instance = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    fix: true,
    overrideConfig: createConfig({ tsconfigRootDir: root }),
  });
  const first = await lint(source, 'fix.ts', instance);
  const formatted = await format(first.output ?? source, {
    ...prettierConfig,
    parser: 'typescript',
  });
  const second = await lint(formatted, 'fix.ts', instance);

  expect(second.messages).toEqual([]);
  expect(second.output ?? formatted).toBe(formatted);
  expect(
    await format(formatted, { ...prettierConfig, parser: 'typescript' }),
  ).toBe(formatted);
  expect(formatted).toMatch(/import \{ token, type User \}/);
});

test('all active rules are errors in JS, TS and test configurations', async () => {
  const paths = ['severity.js', 'severity.ts', 'severity.test.ts'];
  const configs = await Promise.all(
    paths.map(async (file) => {
      return eslint.calculateConfigForFile(join(root, file));
    }),
  );

  configs.forEach((config) => {
    const entries = Object.values(config.rules ?? {});

    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.every((entry) => {
        return guard.array(entry) && (entry[0] === 0 || entry[0] === 2);
      }),
    ).toBe(true);
  });
});

test('manual declarations are checked; generated files require a consumer override', async () => {
  const result = await lint('export type Unsafe = any;', 'manual.d.ts');

  expect(result.messages).toContainEqual(
    expect.objectContaining({
      ruleId: '@typescript-eslint/no-explicit-any',
      severity: 2,
    }),
  );
});

test('build outputs are ignored and arbitrary config directories get no export exception', async () => {
  await mkdir(join(root, 'dist'));

  const ignored = await eslint.lintText('export default 1;', {
    filePath: join(root, 'dist/output.js'),
    warnIgnored: false,
  });

  await mkdir(join(root, 'config'));

  const source = 'export default 1;';

  await writeFile(join(root, 'config/source.ts'), source);

  const [ordinary] = await eslint.lintText(source, {
    filePath: join(root, 'config/source.ts'),
  });

  expect(ignored).toEqual([]);
  expect(ordinary.fatalErrorCount).toBe(0);
  expect(ordinary.messages).toContainEqual(
    expect.objectContaining({
      ruleId: 'import-x/no-default-export',
      severity: 2,
    }),
  );
});

test('exported declarations require separation from following steps', async () => {
  const result = await lint('export const value = 1;\nvoid value;');

  expect(result.messages).toContainEqual(
    expect.objectContaining({
      ruleId: '@stylistic/padding-line-between-statements',
      severity: 2,
    }),
  );
});

test('variables and exports may share a declaration group', async () => {
  const result = await lint(
    'const value = 1;\nexport const result = value;\nexport type Result = number;\nexport function read() { return result; }\n\nvoid read;\n',
  );

  expect(result.messages).toEqual([]);
});
