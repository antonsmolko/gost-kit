import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { ESLint } from 'eslint';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSvelteConfig } from './index';
import { format } from 'prettier';
import prettierConfig from '@gost-kit/prettier-config';

let root: string;
let eslint: ESLint;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'gost-svelte-policy-'));
  await symlink(
    fileURLToPath(new URL('../../../node_modules', import.meta.url)),
    join(root, 'node_modules'),
    'dir',
  );
  await writeFile(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ES2024',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        allowJs: true,
      },
      include: ['**/*.ts', '**/*.svelte', '**/*.js'],
    }),
  );
  eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: await createSvelteConfig({ tsconfigRootDir: root }),
  });
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

let caseNumber = 0;

const lint = async (source: string, file?: string, instance = eslint) => {
  const filePath = join(root, file ?? `Case${caseNumber}.svelte`);

  caseNumber += 1;

  await writeFile(filePath, source);

  const [result] = await instance.lintText(source, { filePath });

  expect(result).toBeDefined();
  expect(result.fatalErrorCount, JSON.stringify(result.messages)).toBe(0);

  return result;
};

const cases = [
  [
    'S01',
    'no-dupe-else-if-blocks',
    '<script lang="ts">const ready = true;</script>{#if ready}<p>A</p>{:else if ready}<p>B</p>{/if}',
  ],
  [
    'S02',
    'no-not-function-handler',
    '<button type="button" onclick={1}>Click</button>',
  ],
  ['S03', 'no-object-in-text-mustaches', '<p>{{ name: "Ada" }}</p>'],
  [
    'S04-key',
    'require-each-key',
    '<script lang="ts">const items = [1];</script>{#each items as item}<p>{item}</p>{/each}',
  ],
  [
    'S04-valid',
    'valid-each-key',
    '<script lang="ts">const items = [1]; const key = 1;</script>{#each items as item (key)}<p>{item}</p>{/each}',
  ],
  ['S05', 'button-has-type', '<button>Click</button>'],
  [
    'S06',
    'no-bind-value-on-checkable-inputs',
    '<script lang="ts">let selected = $state("");</script><input type="checkbox" bind:value={selected} />',
  ],
  [
    'S07-duplicate',
    'no-dupe-style-properties',
    '<p style="color: red; color: blue">Text</p>',
  ],
  [
    'S07-shorthand',
    'no-shorthand-style-property-overrides',
    '<p style="margin-left: 1px; margin: 0">Text</p>',
  ],
  [
    'S07-property',
    'no-unknown-style-directive-property',
    '<p style:colorr="red">Text</p>',
  ],
  [
    'S09',
    'no-svelte-internal',
    '<script lang="ts">import { noop } from "svelte/internal"; void noop;</script>',
  ],
  [
    'S10-debug',
    'no-at-debug-tags',
    '<script lang="ts">const name = "Ada";</script>{@debug name}',
  ],
  [
    'S10-inspect',
    'no-inspect',
    '<script lang="ts">const value = 1; $inspect(value);</script>',
  ],
  [
    'S11-ignore',
    'no-unused-svelte-ignore',
    '<!-- svelte-ignore a11y_autofocus --><p>Text</p>',
  ],
  [
    'S11-props',
    'no-unused-props',
    '<script lang="ts">const props: { used: string; unused: number } = $props();</script><p>{props.used}</p>',
  ],
  [
    'S12',
    'no-unnecessary-state-wrap',
    '<script lang="ts">import { SvelteMap } from "svelte/reactivity"; const map = $state(new SvelteMap());</script><p>{map.size}</p>',
  ],
  [
    'S13',
    'prefer-derived-over-derived-by',
    '<script lang="ts">const value = 1; const doubled = $derived.by(() => { return value * 2; });</script><p>{doubled}</p>',
  ],
  [
    'S14',
    'prefer-writable-derived',
    '<script lang="ts">const { initial }: { initial: number } = $props(); let value = $state(initial); $effect(() => { value = initial; });</script><p>{value}</p>',
  ],
  [
    'AS01',
    'no-at-html-tags',
    '<script lang="ts">const html = "<p>A</p>";</script>{@html html}',
  ],
  ['AS02', 'block-lang', '<script>const value = 1;</script><p>{value}</p>'],
  [
    'AS03-async',
    'no-store-async',
    '<script lang="ts">import { derived, writable } from "svelte/store"; const source = writable(1); const result = derived(source, async (value) => { return value; });</script><p>{$result}</p>',
  ],
  [
    'AS03-unsubscribe',
    'no-ignored-unsubscribe',
    '<script lang="ts">import { writable } from "svelte/store"; const source = writable(1); source.subscribe(() => {});</script>',
  ],
] as const;

describe.each(cases)('%s', (_policy, name, source) => {
  test(`reports svelte/${name} as an error without parser failure`, async () => {
    const result = await lint(source);

    expect(result.messages).toContainEqual(
      expect.objectContaining({ ruleId: `svelte/${name}`, severity: 2 }),
    );
  });
});

test('conflicting component and rune module names report on both real files', async () => {
  await writeFile(join(root, 'Collision.svelte.ts'), 'export const value = 1;');

  const component = await lint('<p>Text</p>', 'Collision.svelte');
  const module = await lint('export const value = 1;', 'Collision.svelte.ts');

  [component, module].forEach((result) => {
    expect(result.messages).toContainEqual(
      expect.objectContaining({
        ruleId: 'svelte/no-conflicting-module-names',
        severity: 2,
      }),
    );
  });
});

test('feature selector and presenter call stay valid; no custom architecture policy is implied', async () => {
  const result = await lint(
    '<script lang="ts">const root = { state: { user: { name: "Ada" } } }; const userPresenter = (user: { name: string }) => { return { name: user.name }; }; const user = $derived(root.state.user); const viewState = $derived(userPresenter(user));</script><p>{viewState.name}</p>',
  );

  expect(result.messages).toEqual([]);
});

test('stateless components require no script and forwarding declared props stays valid', async () => {
  expect((await lint('<p>Text</p>')).messages).toEqual([]);
  expect(
    (
      await lint(
        '<script lang="ts">const props: { id: string; title: string } = $props();</script><div {...props}></div>',
      )
    ).messages,
  ).toEqual([]);
});

test.each(['case.ts', 'case.test.ts', 'state.svelte.ts'])(
  '%s retains typed promise policy',
  async (file) => {
    const result = await lint(
      'export const run = () => { Promise.resolve(); };',
      file,
    );

    expect(result.messages).toContainEqual(
      expect.objectContaining({
        ruleId: '@typescript-eslint/no-floating-promises',
        severity: 2,
      }),
    );
  },
);

test('component scripts retain shared type-aware checks', async () => {
  const result = await lint('<script lang="ts">Promise.resolve();</script>');

  expect(result.messages).toContainEqual(
    expect.objectContaining({
      ruleId: '@typescript-eslint/no-floating-promises',
      severity: 2,
    }),
  );
});

test('ordinary JavaScript works without a TypeScript project or inherited browser globals', async () => {
  const project = await mkdtemp(join(tmpdir(), 'gost-svelte-js-'));

  try {
    const instance = new ESLint({
      cwd: project,
      overrideConfigFile: true,
      overrideConfig: await createSvelteConfig({ tsconfigRootDir: project }),
    });
    const [good] = await instance.lintText(
      'export const read = (value) => { return value; };',
      { filePath: join(project, 'value.js') },
    );
    const [bad] = await instance.lintText('window.alert("hello");', {
      filePath: join(project, 'value.js'),
    });

    expect(good.messages).toEqual([]);
    expect(bad.messages).toContainEqual(
      expect.objectContaining({ ruleId: 'no-undef' }),
    );
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

test('factory requires an absolute root and missing TS projects fail explicitly', async () => {
  await expect(createSvelteConfig({ tsconfigRootDir: '.' })).rejects.toThrow(
    /absolute/i,
  );

  const project = await mkdtemp(join(tmpdir(), 'gost-svelte-missing-'));

  try {
    const instance = new ESLint({
      cwd: project,
      overrideConfigFile: true,
      overrideConfig: await createSvelteConfig({ tsconfigRootDir: project }),
    });
    const [result] = await instance.lintText('export const value = 1;', {
      filePath: join(project, 'value.ts'),
    });

    expect(result.fatalErrorCount).toBe(1);
    expect(result.messages[0].message).toMatch(/project service|tsconfig/i);
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

test('JavaScript rune modules retain rune parsing and JS policy', async () => {
  const good = await lint(
    'export const read = () => { const value = $state.raw(1);\n\nreturn value; };',
    'runes.svelte.js',
  );
  const bad = await lint('export const read = () => 1;', 'bad.svelte.js');

  expect(good.messages).toEqual([]);
  expect(bad.messages).toContainEqual(
    expect.objectContaining({ ruleId: 'arrow-body-style', severity: 2 }),
  );
});

test('consumer overrides preserve known configuration export exceptions', async () => {
  const config = await lint('export default {};', 'vite.config.ts');
  const instance = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      ...(await createSvelteConfig({ tsconfigRootDir: root })),
      { files: ['**/*.svelte'], rules: { 'svelte/button-has-type': 'off' } },
    ],
  });
  const overridden = await lint(
    '<button>Click</button>',
    'Override.svelte',
    instance,
  );

  expect(config.messages).toEqual([]);
  expect(overridden.messages).toEqual([]);
});

test('component fixes merge value/type imports and converge with Prettier', async () => {
  await writeFile(
    join(root, 'shared.ts'),
    "export const prefix = 'Ada';\nexport type User = { name: string };\n",
  );

  const source = `<script lang="ts">import { prefix } from './shared'; import type { User } from './shared'; const user: User = {name:prefix}; const read = () => user.name;</script><p>{read()}</p>`;
  const instance = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    fix: true,
    overrideConfig: await createSvelteConfig({ tsconfigRootDir: root }),
  });
  const first = await lint(source, 'Fix.svelte', instance);
  const formatted = await format(first.output ?? source, {
    ...prettierConfig,
    parser: 'svelte',
    plugins: ['prettier-plugin-svelte'],
  });
  const second = await lint(formatted, 'Fix.svelte', instance);

  expect(second.messages).toEqual([]);
  expect(second.output ?? formatted).toBe(formatted);
  expect(
    await format(formatted, {
      ...prettierConfig,
      parser: 'svelte',
      plugins: ['prettier-plugin-svelte'],
    }),
  ).toBe(formatted);
  expect(formatted).toContain('prefix, type User');
});

test.each(['Reactive.svelte', 'reactive.svelte.ts'])(
  'reports GOST selector diagnostics in %s',
  async (file) => {
    const script = `import type { Store } from '@gost-kit/common';
  declare const root: Store<{ user: { name: string } }, { type: 'RefreshAction' }>;
  const present = (user: { name: string }) => { return user.name; };
  const view = $derived(present(root.state.user));`;
    const source = file.endsWith('.svelte')
      ? `<script lang="ts">${script}</script><p>{view}</p>`
      : script;
    const result = await lint(source, file);

    expect(result.messages).toContainEqual(
      expect.objectContaining({
        ruleId: 'gost/require-feature-state-selector',
        severity: 2,
      }),
    );
  },
);

test('reports a local raw snapshot and autofixes a typed component idempotently', async () => {
  const source =
    '<script lang="ts">let model = $state.raw({ user: { name: "Ada" } }); const present = (user: { name: string }) => { return user.name; }; const view = $derived(present(model.user));</script><p>{view}</p>';
  const instance = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    fix: true,
    overrideConfig: await createSvelteConfig({ tsconfigRootDir: root }),
  });
  const first = await lint(source, 'AutoFixed.svelte', instance);

  expect(first.output).toContain('const user = $derived(model.user);');
  expect(first.output).toContain('$derived(present(user))');
  expect(first.messages).toEqual([]);

  const second = await lint(
    first.output ?? source,
    'AutoFixed.svelte',
    instance,
  );

  expect(second.output).toBeUndefined();
  expect(second.messages).toEqual([]);
});
