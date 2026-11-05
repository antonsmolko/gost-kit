import { afterAll, describe, test, expect } from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { ESLint } from 'eslint';
import * as svelte from 'svelte-eslint-parser';
import ts from 'typescript-eslint';
import { compile } from 'svelte/compiler';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plugin } from '../index';
import { singleIntentDispatch } from './single-intent-dispatch';

const root = mkdtempSync(join(tmpdir(), 'gost-intent-rule-'));

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
      target: 'ES2024',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      types: ['svelte'],
      allowJs: true,
    },
    include: ['**/*.ts', '**/*.svelte', '**/*.js'],
  }),
);
writeFileSync(
  join(root, 'aliases.ts'),
  "export type { Dispatch as Send } from '@gost-kit/common';",
);

const prelude = `import Ui from './Ui.svelte';
import type { Dispatch, Store, AsyncTap } from '@gost-kit/common';
type Action = { type: 'OneAction' } | { type: 'TwoAction' } | { type: 'EmailAction'; email: string };
declare const send: Dispatch<Action>;
declare const store: Store<{ value: number }, Action>;
declare const ready: boolean;
`;
const one = "void send({ type: 'OneAction' });";
const two = "void send({ type: 'TwoAction' });";
let counter = 0;
const fixture = (
  script: string,
  template = '<Ui onconfirm={handle} />',
  module = '',
) => {
  const filename = join(root, `Case${counter}.svelte`);

  counter += 1;

  const code = `${module}<script lang="ts">${prelude}${script}</script>${template}`;

  compile(code, { filename });
  writeFileSync(filename, code);

  return { filename, code };
};

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const valid = [
  fixture(
    `const handle = () => { class Deferred { value = send({type:'OneAction'}); } ${one} };`,
  ),
  fixture(
    `const handle = () => { type Dispatch<T> = (action: T) => Promise<void>; const dispatch: Dispatch<Action> = async () => {}; void dispatch({type:'OneAction'}); void dispatch({type:'TwoAction'}); };`,
  ),
  fixture(
    `const values = ['one']; const handle = () => { ${one} ${two} };`,
    '{#each values as value (value)}{@const handle = () => {}}<Ui onconfirm={handle} />{/each}',
  ),
  fixture(
    `const handle = () => { ${one} }; function unused() { const handle = () => { ${one} ${two} }; return handle; }`,
  ),

  fixture(`const handle = () => { ${one} };`),
  fixture(`const handle = async () => { await send({ type: 'OneAction' }); };`),
  fixture(
    "const handle = (email: string) => { void send({ type: 'EmailAction', email }); };",
    '<Ui onemailchange={handle} />',
  ),
  fixture(
    `const handle = () => { ${one} }; const alias = handle;`,
    '<Ui onConfirm={alias} />',
  ),
  fixture(
    `const effector = () => { ${one} ${two} }; const handle = () => { ${one} };`,
  ),
  fixture(
    `const handle = () => { const deferred = () => { if (ready) { ${one} ${two} } }; ${one} };`,
  ),
  fixture(
    `const handle = () => { class Model { run() { ${one} ${two} } } ${one} };`,
  ),
  fixture(
    "const dispatch = (_action: Action) => {}; const handle = () => { if (ready) { dispatch({ type: 'OneAction' }); } dispatch({ type: 'TwoAction' }); };",
  ),
  fixture(
    "type Dispatch<T> = (value: T) => Promise<void>; declare const other: Dispatch<Action>; const handle = () => { void other({ type: 'OneAction' }); void other({ type: 'TwoAction' }); };"
      .replace('type Dispatch<T>', 'type LocalDispatch<T>')
      .replace('other: Dispatch<Action>', 'other: LocalDispatch<Action>'),
  ),
  fixture(
    "declare const other: AsyncTap<Action>; const handle = () => { void other({ type: 'OneAction' }); void other({ type: 'TwoAction' }); };",
  ),
  fixture(
    "declare const other: Dispatch<Action> | AsyncTap<Action>; const handle = () => { void other({ type: 'OneAction' }); void other({ type: 'TwoAction' }); };",
  ),
  fixture(
    'declare const other: any; const handle = () => { other(); other(); };',
  ),
  fixture(
    'declare const presenter: { confirm: () => void };',
    '<Ui onconfirm={presenter.confirm} />',
  ),
  fixture(`const handle = () => { ${one} ${two} };`, '<Ui confirm={handle} />'),
  fixture(
    `const handle = () => { ${one} ${two} };`,
    '<p>Not an event handler</p>',
  ),
  fixture(
    'const title = "Ready";',
    '<Ui onconfirm={handle} />',
    `<script lang="ts" module>import type { Dispatch } from '@gost-kit/common'; declare const send: Dispatch<{type:'OneAction'}>; const handle = () => { void send({type:'OneAction'}); void send({type:'OneAction'}); };</script>`,
  ),
];
const invalid = [
  [
    'static field executes',
    `const handle = () => { class Active { static value = send({type:'OneAction'}); } ${one} };`,
    'multipleDispatch',
  ],
  [
    'for of',
    `const handle = () => { for (const value of [1]) { ${one} } };`,
    'conditionalDispatch',
  ],
  [
    'for in',
    `const handle = () => { for (const value in {a:1}) { ${one} } };`,
    'conditionalDispatch',
  ],

  ['sequential', `const handle = () => { ${one} ${two} };`, 'multipleDispatch'],
  [
    'exclusive branches',
    `const handle = () => { if (ready) { ${one} } else { ${two} } };`,
    'multipleDispatch',
  ],
  [
    'guard',
    `const handle = () => { if (!ready) { return; } ${one} };`,
    'conditionalDispatch',
  ],
  [
    'if',
    `const handle = () => { if (ready) { ${one} } };`,
    'conditionalDispatch',
  ],
  [
    'switch',
    `const handle = () => { switch (ready) { case true: ${one} break; } };`,
    'conditionalDispatch',
  ],
  [
    'for',
    `const handle = () => { for (let i = 0; i < 2; i++) { ${one} } };`,
    'conditionalDispatch',
  ],
  [
    'while',
    `const handle = () => { while (ready) { ${one} } };`,
    'conditionalDispatch',
  ],
  [
    'do while',
    `const handle = () => { do { ${one} } while (ready); };`,
    'conditionalDispatch',
  ],
  [
    'ternary action',
    "const handle = () => { void send({ type: ready ? 'OneAction' : 'TwoAction' }); };",
    'conditionalDispatch',
  ],
  [
    'short circuit',
    "const handle = () => { ready && send({ type: 'OneAction' }); };",
    'conditionalDispatch',
  ],
  [
    'store member',
    "const handle = () => { void store.dispatch({ type: 'OneAction' }); void store.dispatch({ type: 'TwoAction' }); };",
    'multipleDispatch',
  ],
  [
    'const dispatch alias',
    `const dispatch = send; const handle = () => { void dispatch({type:'OneAction'}); void dispatch({type:'TwoAction'}); };`,
    'multipleDispatch',
  ],
  [
    'destructured dispatch',
    "const { dispatch } = store; const handle = () => { void dispatch({type:'OneAction'}); void dispatch({type:'TwoAction'}); };",
    'multipleDispatch',
  ],
  [
    'type alias',
    `type Alias<T extends Action> = Dispatch<T>; declare const dispatch: Alias<Action>; const handle = () => { void dispatch({type:'OneAction'}); void dispatch({type:'TwoAction'}); };`,
    'multipleDispatch',
  ],
  [
    'reexport type',
    "import type { Send } from './aliases'; declare const dispatch: Send<Action>; const handle = () => { void dispatch({type:'OneAction'}); void dispatch({type:'TwoAction'}); };",
    'multipleDispatch',
  ],
  [
    'nullable',
    "declare const dispatch: Dispatch<Action> | undefined; const handle = () => { void dispatch?.({type:'OneAction'}); void dispatch?.({type:'TwoAction'}); };",
    'multipleDispatch',
  ],
  ['named function', `function handle() { ${one} ${two} }`, 'multipleDispatch'],
  [
    'handler alias',
    `const original = () => { ${one} ${two} }; const handle = original;`,
    'multipleDispatch',
  ],
  [
    'inferred Store',
    "import { createStore } from '@gost-kit/svelte'; const app = createStore({ initState: {value:0}, reducer: (state, _action: Action) => ({ state, effects: [] }), effector: async () => {} }); const handle = () => { void app.dispatch({type:'OneAction'}); void app.dispatch({type:'TwoAction'}); };",
    'multipleDispatch',
  ],
] as const;

new RuleTester({
  languageOptions: {
    parser: svelte,
    parserOptions: {
      parser: ts.parser,
      projectService: true,
      tsconfigRootDir: root,
      extraFileExtensions: ['.svelte'],
    },
  },
}).run('single-intent-dispatch', singleIntentDispatch, {
  valid,
  invalid: [
    {
      ...fixture(
        `const onConfirm = () => { ${one} ${two} };`,
        '<Ui {onConfirm} />',
      ),
      name: 'shorthand callback prop',
      output: null,
      errors: [{ messageId: 'multipleDispatch' }],
    },
    ...invalid.map(([name, script, messageId]) => {
      return {
        ...fixture(script),
        name,
        output: null,
        errors: [{ messageId }],
      };
    }),
    {
      ...fixture(
        `const handle = () => { ${one} ${two} };`,
        '<Ui onconfirm={handle} onaccept={handle} />',
      ),
      name: 'handler reported once',
      output: null,
      errors: [{ messageId: 'multipleDispatch' }],
    },
    {
      ...fixture('', `<Ui onConfirm={() => { ${one} ${two} }} />`),
      name: 'inline callback',
      output: null,
      errors: [{ messageId: 'multipleDispatch' }],
    },
    {
      ...fixture(
        `const handle = () => { ${one} ${two} };`,
        '<button on:click={handle}>Go</button>',
      ),
      name: 'legacy event',
      output: null,
      errors: [{ messageId: 'multipleDispatch' }],
    },
    {
      ...fixture(
        `const handle = (event: KeyboardEvent) => { if (event.key !== 'Enter') { return; } ${one} };`,
        '<button onkeydown={handle}>Go</button>',
      ),
      name: 'browser guard has no exception',
      output: null,
      errors: [{ messageId: 'conditionalDispatch' }],
    },
  ],
});

test('enabled typed component requires type services', () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.svelte'],
        languageOptions: {
          parser: svelte,
          parserOptions: { parser: ts.parser },
        },
        plugins: { gost: plugin },
        rules: { 'gost/single-intent-dispatch': 'error' },
      },
    ],
  });

  return expect(
    eslint.lintText(
      '<script lang="ts">const ready = true;</script><p>{ready}</p>',
      { filePath: 'Missing.svelte' },
    ),
  ).rejects.toThrow(/type information|parserOptions|type-aware/);
});

new RuleTester({
  languageOptions: { parser: svelte, parserOptions: { parser: ts.parser } },
}).run('single-intent-dispatch skips untyped scripts', singleIntentDispatch, {
  valid: [
    {
      filename: 'Plain.svelte',
      code: '<script>const send = () => {}; const handle = () => { send(); send(); };</script><button onclick={handle}>Go</button>',
    },
    {
      filename: 'Mixed.svelte',
      code: '<script lang="ts" module>type Action = {type: "OneAction"};</script><script>const send = () => {}; const handle = () => { send(); send(); };</script><button onclick={handle}>Go</button>',
    },
    { filename: 'Stateless.svelte', code: '<p>Ready</p>' },
  ],
  invalid: [],
});
new RuleTester({ languageOptions: { parser: ts.parser } }).run(
  'single-intent-dispatch skips noncomponents',
  singleIntentDispatch,
  {
    valid: ['const send = () => {}; const handle = () => { send(); send(); };'],
    invalid: [],
  },
);
