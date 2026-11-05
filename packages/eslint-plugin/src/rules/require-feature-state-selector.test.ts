import { afterAll, describe, test } from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import ts from 'typescript-eslint';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFeatureStateSelector } from './require-feature-state-selector';

const root = mkdtempSync(join(tmpdir(), 'gost-selector-rule-'));

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
      module: 'ESNext',
      moduleResolution: 'Bundler',
      target: 'ESNext',
      types: ['svelte'],
    },
    include: ['**/*.ts'],
  }),
);
writeFileSync(join(root, 'names.ts'), "export const user = 'Taken';\n");
writeFileSync(
  join(root, 'reexport.ts'),
  "export type { Store as AppStore } from '@gost-kit/common';\n",
);
afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const prelude = `import type { Store } from '@gost-kit/common';
type User = { name: string };
type State = { user: User; config: { title: string }; users: User[] };
type Action = { type: 'RefreshAction' };
declare const root: Store<State, Action>;
declare const userPresenter: (user: User) => { label: string };
declare const pagePresenter: (user: User, config: State['config']) => object;
declare const consume: (value: unknown) => unknown;
declare const readName: (user: User) => string;
`;

writeFileSync(
  join(root, 'rune-types.ts'),
  'export type $state = number; export type $derived = number;',
);

let counter = 0;
const fixture = (source: string) => {
  const filename = join(root, `Case${counter}.svelte.ts`);

  counter += 1;

  const code = prelude + source;

  writeFileSync(filename, code);

  return { filename, code };
};
const valid = [
  'const $derived = { by: (fn: () => unknown) => fn() }; const view = $derived.by(() => userPresenter(root.state.user));',
  'const $state = { raw: (value: State) => value }; function read() { type $state = number; const model = $state.raw(root.state); return $derived.by(() => userPresenter(model.user)); }',

  'const view = $derived.by(function* () { yield userPresenter(root.state.user); });',
  'const view = $derived(class { value = userPresenter(root.state.user); });',
  'const { user } = $state.raw({ user: { name: "Ada" } }); const view = $derived(consume(user.name));',
  'const [user] = $state.raw([{ name: "Ada" }]); const view = $derived(consume(user.name));',

  'const user = $derived(root.state.user); const view = $derived(userPresenter(user));',
  'const user = $derived(root.state.user); const config = $derived(root.state.config); const view = $derived(pagePresenter(user, config));',
  'const user = $derived.by(() => root.state.user);',
  'const handleCopyName = () => { void navigator.clipboard.writeText(root.state.user.name); };',
  "const settings = { state: { user: { name: 'Ada' } } }; const view = $derived(userPresenter(settings.state.user));",
  'const app = root; const user = $derived(app.state.user); const view = $derived(userPresenter(user));',
  'const lazy = $derived(() => userPresenter(root.state.user));',
  'const lazy = $derived.by(() => () => userPresenter(root.state.user));',
  'const lazy = $derived(consume(() => userPresenter(root.state.user)));',
  'declare const mixed: Store<State, Action> | { state: State }; const view = $derived(userPresenter(mixed.state.user));',
  'declare const unknown: any; const view = $derived(userPresenter(unknown.state.user));',
  'let model = $state({ user: { name: "Ada" } }); const view = $derived(userPresenter(model.user));',
  'let model = $state.raw({ user: { name: "Ada" } }); const snapshot = model; const view = $derived(userPresenter(snapshot.user));',
  'const $state = { raw: (value: State) => value }; const model = $state.raw(root.state); const view = $derived(userPresenter(model.user));',
  'const $derived = (value: unknown) => value; const view = $derived(userPresenter(root.state.user));',
];
const autofixCases = [
  ...[
    'type $derived = number;',
    'import type { $derived } from "./rune-types";',
    'import { type $derived } from "./rune-types";',
  ].map((declaration) => {
    return [
      `derived type shadow fix: ${declaration}`,
      `${declaration}\nconst view = $derived(userPresenter(root.state.user));`,
      `${declaration}\nconst user = $derived(root.state.user);\nconst view = $derived(userPresenter(user));`,
    ];
  }),

  [
    'raw snapshot',
    'let model = $state.raw({ user: { name: "Ada" } });\nconst view = $derived(userPresenter(model.user));',
    'let model = $state.raw({ user: { name: "Ada" } });\nconst user = $derived(model.user);\nconst view = $derived(userPresenter(user));',
  ],
  [
    'import collision',
    "import { user } from './names';\nconst view = $derived(userPresenter(root.state.user));",
    "import { user } from './names';\nconst userV2 = $derived(root.state.user);\nconst view = $derived(userPresenter(userV2));",
  ],
  [
    'simple selector',
    'const view = $derived(userPresenter(root.state.user));',
    'const user = $derived(root.state.user);\nconst view = $derived(userPresenter(user));',
  ],
  [
    'alias',
    'const app = root;\nconst view = $derived(userPresenter(app.state.user));',
    'const app = root;\nconst user = $derived(app.state.user);\nconst view = $derived(userPresenter(user));',
  ],
  [
    'V2 collision',
    "const user = 'Other';\nconst view = $derived(userPresenter(root.state.user));",
    "const user = 'Other';\nconst userV2 = $derived(root.state.user);\nconst view = $derived(userPresenter(userV2));",
  ],
  [
    'V3 collision',
    "const user = 'Other';\nconst userV2 = 'Existing';\nconst view = $derived(userPresenter(root.state.user));",
    "const user = 'Other';\nconst userV2 = 'Existing';\nconst userV3 = $derived(root.state.user);\nconst view = $derived(userPresenter(userV3));",
  ],
  [
    'later binding',
    "const view = $derived(userPresenter(root.state.user));\nconst user = 'Other';",
    "const userV2 = $derived(root.state.user);\nconst view = $derived(userPresenter(userV2));\nconst user = 'Other';",
  ],
  [
    'outer reference',
    'declare const user: string;\nconst view = $derived(userPresenter(root.state.user));',
    'declare const user: string;\nconst userV2 = $derived(root.state.user);\nconst view = $derived(userPresenter(userV2));',
  ],
  [
    'static brackets',
    "const view = $derived(userPresenter(root['state']['user']));",
    "const user = $derived(root['state']['user']);\nconst view = $derived(userPresenter(user));",
  ],
];
const noFixCases = [
  ...[
    'type $derived = number;',
    'interface $derived { value: number }',
    'import type { $derived } from "./rune-types";',
    'import { type $derived } from "./rune-types";',
  ].map((declaration) => {
    return [
      `derived type shadow: ${declaration}`,
      `${declaration} const view = $derived.by(() => userPresenter(root.state.user));`,
      1,
    ];
  }),
  ...[
    'type $state = number;',
    'import type { $state } from "./rune-types";',
    'import { type $state } from "./rune-types";',
  ].map((declaration) => {
    return [
      `raw type shadow: ${declaration}`,
      `${declaration} let model = $state.raw({ user: { name: "Ada" } }); const view = $derived.by(() => userPresenter(model.user));`,
      1,
    ];
  }),

  [
    'constructor',
    'declare const Badge: new (user: User) => object; const view = $derived(new Badge(root.state.user));',
    1,
  ],
  [
    'tagged template',
    'declare const tag: (strings: TemplateStringsArray, user: User) => object; const view = $derived(tag`${root.state.user}`);',
    1,
  ],
  [
    'static field',
    'const view = $derived(class { static value = userPresenter(root.state.user); });',
    1,
  ],
  ...[
    '$state',
    '$derived',
    '$effect',
    '$props',
    '$bindable',
    '$inspect',
    '$host',
    '$other',
  ].map((name) => {
    return [
      `dollar field ${name}`,
      `let model = $state.raw({ ${name}: { name: "Ada" } }); const view = $derived(userPresenter(model.${name}));`,
      1,
    ];
  }),

  [
    'raw by',
    'let model = $state.raw({ user: { name: "Ada" } }); const view = $derived.by(() => userPresenter(model.user));',
    1,
  ],
  [
    'nested getter path',
    'const view = $derived(consume(root.state.user.name));',
    1,
  ],
  ['optional method', 'const view = $derived(consume?.(root.state.user));', 1],
  [
    'intersection',
    'declare const app: Store<State, Action> & { tag: string }; const view = $derived.by(() => userPresenter(app.state.user));',
    1,
  ],
  [
    'Readonly alias',
    'declare const app: Readonly<Store<State, Action>>; const view = $derived.by(() => userPresenter(app.state.user));',
    1,
  ],
  [
    '$derived.by',
    'const view = $derived.by(() => userPresenter(root.state.user));',
    1,
  ],
  [
    'method receiver',
    'const names = $derived(root.state.users.map(readName));',
    1,
  ],
  [
    'two branches',
    'const view = $derived(pagePresenter(root.state.user, root.state.config));',
    2,
  ],
  [
    'nullable Store',
    'declare const app: Store<State, Action> | undefined; const view = $derived(consume(app?.state.user));',
    1,
  ],
  [
    'conditional',
    'declare const ready: boolean; const view = $derived(ready ? userPresenter(root.state.user) : undefined);',
    1,
  ],
  [
    'earlier argument side effect',
    'const view = $derived(consume([consume(1), root.state.user]));',
    1,
  ],
  [
    'container property',
    'const container = { root }; const view = $derived(userPresenter(container.root.state.user));',
    1,
  ],
  [
    'dynamic key',
    'declare const key: keyof State; const view = $derived(consume(root.state[key]));',
    1,
  ],
  [
    'multiple declarators',
    'const other = 1, view = $derived(userPresenter(root.state.user));',
    1,
  ],
  [
    'reexport alias',
    "import type { AppStore } from './reexport'; declare const app: AppStore<State, Action>; const view = $derived.by(() => userPresenter(app.state.user));",
    1,
  ],
  [
    'inferred createStore',
    "import { createStore } from '@gost-kit/svelte'; const app = createStore({initState: {user: {name: 'Ada'}}, reducer: (state) => ({state, effects: []}), effector: async () => {}}); const view = $derived.by(() => userPresenter(app.state.user));",
    1,
  ],
  ['whole snapshot', 'const view = $derived(consume(root.state));', 1],
  [
    'nested derived',
    'const view = $derived.by(() => { const inside = $derived(userPresenter(root.state.user)); return inside; });',
    1,
  ],
];
const tester = new RuleTester({
  languageOptions: {
    parser: ts.parser,
    parserOptions: { projectService: true, tsconfigRootDir: root },
  },
});

tester.run('require-feature-state-selector', requireFeatureStateSelector, {
  valid: valid.map(fixture),
  invalid: [
    ...autofixCases.map(([name, input, output]) => {
      return {
        ...fixture(input),
        name,
        output: prelude + output,
        errors: [
          {
            messageId: 'selectFeature' as const,
            ...(name === 'simple selector'
              ? { line: 10, column: 37, endLine: 10, endColumn: 52 }
              : {}),
          },
        ],
      };
    }),
    ...noFixCases.map(([name, input, count]) => {
      return {
        ...fixture(input as string),
        name: name as string,
        output: null,
        errors: Array.from({ length: count as number }, () => {
          return { messageId: 'selectFeature' as const };
        }),
      };
    }),
  ],
});
