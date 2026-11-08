import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { ESLint } from 'eslint';
import { createJiti } from 'jiti';
import type * as ProjectConfigModule from './eslint-config';

const { createProjectConfig } = await createJiti(import.meta.url).import<
  typeof ProjectConfigModule
>('./eslint-config');

let root: string;
let eslint: ESLint;

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'gost-project-lint-'));
  await writeFile(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: { strict: true, target: 'ES2024', module: 'ESNext' },
      include: ['**/*.ts', '**/*.svelte'],
    }),
  );
  eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: await createProjectConfig(root),
  });
});

after(async () => {
  await rm(root, { recursive: true, force: true });
});

const lint = async (file: string, source: string) => {
  const filePath = join(root, file);

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, source);

  const [result] = await eslint.lintText(source, { filePath });

  assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));

  return result.messages;
};

const cases = [
  ['ordinary.js', 'export const read = (value) => value;', 'arrow-body-style'],
  [
    'policy.ts',
    'export const value: any = 1;',
    '@typescript-eslint/no-explicit-any',
  ],
  [
    'policy.test.ts',
    'declare const value: string | undefined;\n\nexport const text = value!;',
    '@typescript-eslint/no-non-null-assertion',
  ],
  [
    'state.svelte.ts',
    'export const run = () => { Promise.resolve(); };',
    '@typescript-eslint/no-floating-promises',
  ],
  [
    'View.svelte',
    '<script lang="ts">Promise.resolve();</script>',
    '@typescript-eslint/no-floating-promises',
  ],
  [
    'Braces.svelte',
    '<script lang="ts">const read = (value: boolean) => { if (value) return 1; }; void read;</script>',
    'curly',
  ],
];

cases.forEach(([file, source, ruleId]) => {
  void test(`${file} retains ${ruleId} as an error`, async () => {
    const messages = await lint(file, source);

    assert.ok(
      messages.some((message) => {
        return message.ruleId === ruleId && message.severity === 2;
      }),
      JSON.stringify(messages),
    );
  });
});

void test('default exports remain scoped to known configurations', async () => {
  assert.deepEqual(await lint('vite.config.ts', 'export default {};'), []);

  const messages = await lint('ordinary.ts', 'export default {};');

  assert.ok(
    messages.some((message) => {
      return message.ruleId === 'import-x/no-default-export';
    }),
  );
});

void test('Svelte runes and component expressions parse with the shared policy', async () => {
  assert.deepEqual(
    await lint(
      'valid.svelte.ts',
      'export const read = () => { const state = $state.raw(1);\n\nreturn state; };',
    ),
    [],
  );
  assert.deepEqual(
    await lint(
      'ValidView.svelte',
      '<script lang="ts">const count = $state(1);</script><p>{count}</p>',
    ),
    [],
  );
});

[
  'dist/output.js',
  '.svelte-kit/generated.js',
  'playwright-report/report.js',
].forEach((file) => {
  void test(`shared/project ignores exclude ${file}`, async () => {
    const results = await eslint.lintText('export default 1;', {
      filePath: join(root, file),
      warnIgnored: false,
    });

    assert.deepEqual(results, []);
  });
});

void test('project explicitly enables the component policy for src components', async () => {
  const messages = await lint(
    'src/Local.svelte',
    '<script lang="ts">const count = $state(1);</script><p>{count}</p>',
  );

  assert.ok(
    messages.some((message) => {
      return (
        message.ruleId === 'gost/no-component-state' && message.severity === 2
      );
    }),
    JSON.stringify(messages),
  );
});

void test('component-only project override leaves shell rune modules available', async () => {
  const messages = await lint(
    'src/shell/local.svelte.ts',
    'export const read = () => { const state = $state.raw(1);\n\nreturn state; };',
  );

  assert.deepEqual(messages, []);
});

void test('project explicitly enables single intent policy for business components', async () => {
  const config = await eslint.calculateConfigForFile(
    join(root, 'src/Business.svelte'),
  );

  assert.deepEqual(config?.rules?.['gost/single-intent-dispatch'], [2]);
});

void test('project enables ready boolean template conditions for business components', async () => {
  const config = await eslint.calculateConfigForFile(
    join(root, 'src/Business.svelte'),
  );

  assert.deepEqual(config?.rules?.['gost/ready-boolean-condition'], [2]);
});
