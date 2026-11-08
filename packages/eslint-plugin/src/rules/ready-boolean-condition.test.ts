import { afterAll, describe, expect, test } from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { ESLint } from 'eslint';
import * as svelte from 'svelte-eslint-parser';
import ts from 'typescript-eslint';
import { compile } from 'svelte/compiler';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readyBooleanCondition } from './ready-boolean-condition';
import { plugin } from '../index';

const root = mkdtempSync(join(tmpdir(), 'gost-ready-boolean-'));

symlinkSync(
  fileURLToPath(new URL('../../../../node_modules', import.meta.url)),
  join(root, 'node_modules'),
  'dir',
);
writeFileSync(
  join(root, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      strict: true,
      allowJs: true,
      target: 'ESNext',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      types: ['svelte'],
    },
    include: ['**/*.svelte', '**/*.ts', '**/*.js'],
  }),
);
afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

let count = 0;
const fixture = (code: string) => {
  const filename = join(root, `Case${count}.svelte`);

  count += 1;

  compile(code, { filename });
  writeFileSync(filename, code);

  return { code, filename };
};
const component = (declaration: string, condition: string) => {
  return fixture(
    `<script lang="ts">${declaration}</script>{#if ${condition}}<p>Ready</p>{/if}`,
  );
};
const valid = [
  fixture('{#if true}<p>A</p>{:else if false}<p>B</p>{:else}<p>C</p>{/if}'),
  component('let { ready }: { ready: boolean } = $props();', 'ready'),
  component(
    'type Ready = boolean; let { ready }: { ready: Ready } = $props();',
    'ready',
  ),
  component(
    'let { view }: { view: { ready: true | false } } = $props();',
    'view.ready',
  ),
  component(
    'let { view }: { view: { ready: boolean } } = $props();',
    "view['ready']",
  ),
  component('let { flags }: { flags: boolean[] } = $props();', 'flags[0]'),
  component('const view = { ready: true };', 'view?.ready'),
  fixture(
    '<script lang="ts" generics="T extends boolean">let { ready }: { ready: T } = $props();</script>{#if ready}<p>Ready</p>{/if}',
  ),
  fixture(
    '<script lang="ts">const rows = [{ ready: true }];</script>{#each rows as row}{#if row.ready}<p>Ready</p>{/if}{/each}',
  ),
  fixture(
    '<script lang="ts">const request = Promise.resolve({ ready: true });</script>{#await request then result}{#if result.ready}<p>Ready</p>{/if}{/await}',
  ),
  fixture(
    '<script lang="ts"></script>{#snippet check(ready: boolean)}{#if ready}<p>Ready</p>{/if}{/snippet}{@render check(true)}',
  ),
  fixture('<script>const ready = true;</script>{#if ready}<p>Ready</p>{/if}'),
  fixture('{#each [true, false] as ready}{#if ready}<p>Ready</p>{/if}{/each}'),
  fixture(
    '<script lang="ts">let { ready }: { ready: boolean | null } = $props();</script>{#if typeof ready === "boolean"}{#if ready}<p>Ready</p>{/if}{/if}',
  ),
];
// The outer condition is invalid; the inner narrowed read is valid.
const narrowed = valid.pop();

if (!narrowed) {
  throw new Error('Missing narrowing fixture');
}

const invalid = [
  ...[
    'null',
    'undefined',
    'string',
    'number',
    'object',
    'any',
    'unknown',
    'never',
    'boolean | null',
    'boolean | undefined',
    'boolean | string',
  ].map((type) => {
    return component(`let { value }: { value: ${type} } = $props();`, 'value');
  }),
  component(
    'let { view }: { view: { ready: boolean } | null } = $props();',
    'view?.ready',
  ),
  component('const view = { ready: true }; const key = "ready";', 'view[key]'),
  component('const flags = [true]; const index = 0;', 'flags[index]'),
  component('const ready = true;', '!ready'),
  component('const ready = true;', 'ready && true'),
  component('const ready = true;', 'ready === true'),
  component('const ready = true;', 'ready ? true : false'),
  component('const read = () => true;', 'read()'),
  component('const read = () => ({ ready: true });', 'read().ready'),
  component(
    'const view = { ready: true }; const key = () => "ready";',
    'view[key()]',
  ),
  component(
    'let { ready }: { ready: unknown } = $props();',
    'ready as boolean',
  ),
  component(
    'let { ready }: { ready: boolean | undefined } = $props();',
    'ready!',
  ),
  component('const ready = true;', 'ready satisfies boolean'),
  fixture(
    '<script lang="ts" generics="T">let { ready }: { ready: T } = $props();</script>{#if ready}<p>Ready</p>{/if}',
  ),
  fixture(
    '<script>const value = { name: "Ada" };</script>{#if value}<p>Ready</p>{/if}',
  ),
  fixture(
    '<script lang="ts">const ready = true;</script>{#each ["wrong"] as ready}{#if ready}<p>Ready</p>{/if}{/each}',
  ),
  fixture(
    '<script>let { ready = true } = $props();</script>{#if ready}<p>Ready</p>{/if}',
  ),
  fixture(
    '<script lang="ts" generics="T extends any">let { ready }: { ready: T } = $props();</script>{#if ready}<p>Ready</p>{/if}',
  ),
  fixture(
    '<script lang="ts" generics="T extends never">let { ready }: { ready: T } = $props();</script>{#if ready}<p>Ready</p>{/if}',
  ),
  narrowed,
];
const parserOptions = {
  parser: ts.parser,
  projectService: true,
  tsconfigRootDir: root,
  extraFileExtensions: ['.svelte'],
};

new RuleTester({ languageOptions: { parser: svelte, parserOptions } }).run(
  'ready-boolean-condition',
  readyBooleanCondition,
  {
    valid,
    invalid: [
      ...invalid.map((entry) => {
        return {
          ...entry,
          output: null,
          errors: [{ messageId: 'readyBoolean' as const }],
        };
      }),
      {
        ...fixture(
          '<script lang="ts">const value = "wrong";</script>{#if value}<p>A</p>{:else if !value}<p>B</p>{/if}',
        ),
        output: null,
        errors: [{ messageId: 'readyBoolean' }, { messageId: 'readyBoolean' }],
      },
    ],
  },
);

const withoutServices = new RuleTester({
  languageOptions: { parser: svelte, parserOptions: { parser: ts.parser } },
});

withoutServices.run(
  'ready-boolean-condition syntax without services',
  readyBooleanCondition,
  {
    valid: [
      fixture('{#if true}<p>Ready</p>{/if}'),
      fixture('<p>Ready</p>'),
      fixture(
        '<script lang="ts">if ("text") { console.log("ordinary script if"); }</script>',
      ),
    ],
    invalid: [
      {
        ...fixture('{#if 1}<p>Ready</p>{/if}'),
        errors: [{ messageId: 'readyBoolean' }],
      },
    ],
  },
);

const lintInstance = (typed: boolean, tsconfigRootDir = root) => {
  return new ESLint({
    cwd: tsconfigRootDir,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.svelte'],
        languageOptions: {
          parser: svelte,
          parserOptions: {
            parser: ts.parser,
            ...(typed
              ? {
                  projectService: true,
                  tsconfigRootDir,
                  extraFileExtensions: ['.svelte'],
                }
              : {}),
          },
        },
        plugins: { gost: plugin },
        rules: { 'gost/ready-boolean-condition': 'error' },
      },
    ],
  });
};

test('ready reads require actual type services', async () => {
  const entry = component('const ready = true;', 'ready');

  await expect(
    lintInstance(false).lintText(entry.code, { filePath: entry.filename }),
  ).rejects.toThrow(/type information/u);
});
test.each([{ strict: false }, { strict: true, strictNullChecks: false }])(
  'ready reads require strictNullChecks: %j',
  async (compilerOptions) => {
    const loose = mkdtempSync(join(tmpdir(), 'gost-ready-loose-'));

    try {
      symlinkSync(
        join(root, 'node_modules'),
        join(loose, 'node_modules'),
        'dir',
      );
      writeFileSync(
        join(loose, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            ...compilerOptions,
            target: 'ESNext',
            module: 'ESNext',
          },
          include: ['**/*.svelte'],
        }),
      );

      const filename = join(loose, 'Loose.svelte');
      const code =
        '<script lang="ts">let { ready }: { ready: boolean | null } = $props();</script>{#if ready}<p>Ready</p>{/if}';

      writeFileSync(filename, code);
      await expect(
        lintInstance(true, loose).lintText(code, { filePath: filename }),
      ).rejects.toThrow(/strictNullChecks/u);
    } finally {
      rmSync(loose, { recursive: true, force: true });
    }
  },
);

test('indexed reads respect noUncheckedIndexedAccess', async () => {
  const checked = mkdtempSync(join(tmpdir(), 'gost-ready-indexed-'));

  try {
    symlinkSync(
      join(root, 'node_modules'),
      join(checked, 'node_modules'),
      'dir',
    );
    writeFileSync(
      join(checked, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noUncheckedIndexedAccess: true,
          target: 'ESNext',
          module: 'ESNext',
        },
        include: ['**/*.svelte'],
      }),
    );

    const filename = join(checked, 'Indexed.svelte');
    const code =
      '<script lang="ts">const flags: boolean[] = [true];</script>{#if flags[0]}<p>Ready</p>{/if}';

    compile(code, { filename });
    writeFileSync(filename, code);

    const [result] = await lintInstance(true, checked).lintText(code, {
      filePath: filename,
    });

    expect(result.fatalErrorCount).toBe(0);
    expect(
      result.messages.map(({ ruleId, messageId }) => {
        return { ruleId, messageId };
      }),
    ).toEqual([
      { ruleId: 'gost/ready-boolean-condition', messageId: 'readyBoolean' },
    ]);
  } finally {
    rmSync(checked, { recursive: true, force: true });
  }
});

new RuleTester({ languageOptions: { parser: ts.parser } }).run(
  'ready-boolean-condition does not inspect script conditions',
  readyBooleanCondition,
  {
    valid: [
      {
        filename: 'state.svelte.ts',
        code: 'declare const value: unknown; if (value) { console.log(value); }',
      },
      {
        filename: 'presenter.ts',
        code: 'declare const value: unknown; if (value) { console.log(value); }',
      },
    ],
    invalid: [],
  },
);
