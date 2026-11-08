import { afterAll, describe, expect, test } from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import parser from 'typescript-eslint';
import ts from 'typescript';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFeatureStateSelector } from '../rules/require-feature-state-selector';

// A strict consumer sees only Svelte; common exists solely under Svelte's deps.
const root = mkdtempSync(join(tmpdir(), 'gost-nested-store-'));
const sveltePackage = join(root, 'node_modules/@gost-kit/svelte');
const commonPackage = join(sveltePackage, 'node_modules/@gost-kit/common');

mkdirSync(commonPackage, { recursive: true });

const workspace = fileURLToPath(new URL('../../../../', import.meta.url));

cpSync(join(workspace, 'packages/common/dist'), join(commonPackage, 'dist'), {
  recursive: true,
});
cpSync(
  join(workspace, 'packages/common/package.json'),
  join(commonPackage, 'package.json'),
);
cpSync(join(workspace, 'packages/svelte/dist'), join(sveltePackage, 'dist'), {
  recursive: true,
});
cpSync(
  join(workspace, 'packages/svelte/package.json'),
  join(sveltePackage, 'package.json'),
);
symlinkSync(
  join(workspace, 'node_modules/svelte'),
  join(root, 'node_modules/svelte'),
  'dir',
);
writeFileSync(
  join(root, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      strict: true,
      module: 'ESNext',
      moduleResolution: 'Bundler',
      target: 'ESNext',
      types: ['svelte'],
    },
    include: ['*.ts'],
  }),
);

const filename = join(root, 'Nested.svelte.ts');
const code = `import { createStore } from '@gost-kit/svelte';
const app = createStore({ initState: () => ({ user: { name: 'Ada' } }), reducer: (state) => ({ state, effects: [] }), effector: async () => {} });
const present = (user: { name: string }) => user.name;
const view = $derived.by(() => present(app.state.user));`;

writeFileSync(filename, code);
afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;
test('common cannot resolve from the consumer itself', () => {
  expect(
    ts.resolveModuleName(
      '@gost-kit/common',
      filename,
      { moduleResolution: ts.ModuleResolutionKind.Bundler },
      ts.sys,
    ).resolvedModule,
  ).toBeUndefined();
});
new RuleTester({
  languageOptions: {
    parser: parser.parser,
    parserOptions: { projectService: true, tsconfigRootDir: root },
  },
}).run('nested Store provenance', requireFeatureStateSelector, {
  valid: [],
  invalid: [
    { filename, code, output: null, errors: [{ messageId: 'selectFeature' }] },
  ],
});
