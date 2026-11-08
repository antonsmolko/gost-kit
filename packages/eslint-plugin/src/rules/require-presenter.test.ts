import { afterAll, describe, expect, test } from 'vitest';
import {
  RuleTester,
  type ValidTestCase,
  type InvalidTestCase,
} from '@typescript-eslint/rule-tester';
import { plugin } from '../index';
import { ESLint } from 'eslint';
import * as svelte from 'svelte-eslint-parser';
import ts from 'typescript-eslint';
import { requirePresenter } from './require-presenter';
import { presenterFixtures } from './require-presenter.test-helper';

const { root, fixture, component } = presenterFixtures();

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const input =
  "const user = { name: 'Ada' }; const view = { label: 'Ada', rows: [{ id: 1 }], index: 0 };";
const imported = "import { personPresenter } from './person.presenter';";
const valid: ValidTestCase<[]>[] = [
  'const name = $derived(user.name);',
  'const name = $derived(user?.name);',
  'const row = $derived(view.rows[view.index]);',
  'const row = $derived(view.rows[0]);',
  'const value = $derived({ user, list: [null, true, -1, +2, 1n], ...view });',
  'const value = $derived(`constant`);',
  'const value = $derived((user as { name: string })!.name);',
  'const value = $derived(user satisfies { name: string });',
  `${imported} const ready = $derived(personPresenter({ state: user }));`,
  `${imported} const ready = $derived(personPresenter({ state: user }).label);`,
  `${imported} const ready = $derived(personPresenter?.({ state: user }));`,
  "import { personPresenter as prepare } from './person.presenter'; const ready = $derived(prepare({ state: user }));",
  "import prepare from './person.presenter'; const ready = $derived(prepare({ state: user }));",
  "import * as presenters from './person.presenter'; const ready = $derived(presenters.personPresenter({ state: user }));",
  "import * as presenters from './barrel'; const ready = $derived(presenters['publicPresenter']({ state: user }));",
  "import { publicPresenter } from './nested'; const ready = $derived(publicPresenter({ state: user }));",
  "import { defaultPresenter } from './barrel'; const ready = $derived(defaultPresenter({ state: user }));",
  "import { typedPresenter } from './barrel'; const ready = $derived(typedPresenter({ state: user }));",
  "import { externalPresenter } from './external.presenter'; const ready = $derived(externalPresenter({ state: user }));",
  `${imported} const alias = personPresenter; const next = alias; const ready = $derived(next({ state: user }));`,
  `${imported} const ready = $derived.by(() => personPresenter({ state: user }));`,
  `${imported} const ready = $derived.by(function () { const selected = user; const { name } = selected; return personPresenter({ state: { name } }); });`,
  'const ready = $derived.by(() => { const { name } = user; return name; });',
  `${imported} const ready = $derived({ first: personPresenter({ state: user }), second: personPresenter({ state: user }) });`,
].map((script) => {
  return component(input + script);
});

valid.push({
  ...fixture(
    input +
      imported +
      'const ready = $derived(personPresenter({ state: user }));',
    true,
  ),
  languageOptions: { parser: ts.parser },
});
valid.push(
  fixture(
    '<script>const user = { name: "Ada" }; const ready = $derived(user.name);</script>',
  ),
);
valid.push(
  ...[
    'const $derived = (value: unknown) => value; const ready = $derived(user.name.trim());',
    'const $derived = { by: (fn: () => unknown) => fn() }; const ready = $derived.by(() => user.name.trim());',
  ].map((script) => {
    return {
      ...fixture(input + script, true, false),
      languageOptions: { parser: ts.parser },
    };
  }),
);

const expressions = [
  'user.name.trim()',
  'user.name + "!"',
  '!view.label',
  'view.label || "default"',
  'view.label ?? "default"',
  'view.index ? user : view',
  '`Hello ${user.name}`',
  'new Date()',
  'view.index++',
  '(view.index = 2)',
  '() => user.name',
  '[user.name.trim()]',
  '({ label: user.name.trim() })',
  'view.rows[view.index + 1]',
  '({ get label() { return user.name; } })',
  '({ label() { return user.name; } })',
  '(user.name.trim() as string)',
  'String(user.name)',
  'view.rows.map(row => row.id)',
];
const invalid: InvalidTestCase<'requirePresenter', []>[] = expressions.map(
  (expression) => {
    return {
      ...component(input + `const ready = $derived(${expression});`),
      errors: [{ messageId: 'requirePresenter' as const }],
    };
  },
);

[
  "import { format } from './format'; const ready = $derived(format(user));",
  "import { fakePresenter } from './forged.presenter'; const ready = $derived(fakePresenter(user));",
  "import { javascriptPresenter } from './javascript.presenter'; const ready = $derived(javascriptPresenter(user));",
  'const userPresenter = (value: unknown) => value; const ready = $derived(userPresenter(user));',
  `${imported} let alias = personPresenter; const ready = $derived(alias({ state: user }));`,
  `${imported} const ready = $derived(personPresenter({ state: { name: user.name.trim() } }));`,
  `${imported} const ready = $derived.by(() => { if (view.index) return personPresenter({ state: user }); return user; });`,
  'const ready = $derived.by(() => { let name = user.name; return name; });',
  'const ready = $derived.by(() => { const { name = "Unknown" } = user; return name; });',
  'const ready = $derived.by(() => { view.index++; return user; });',
  'const ready = $derived.by(() => { const calculate = () => user.name; return calculate(); });',
].forEach((script) => {
  invalid.push({
    ...component(input + script),
    errors: [{ messageId: 'requirePresenter' as const }],
  });
});
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
}).run('require-presenter', requirePresenter, { valid, invalid });

test('requires type services only when deciding a presenter call', async () => {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.svelte'],
        languageOptions: {
          parser: svelte,
          parserOptions: { parser: ts.parser },
        },
        plugins: { gost: plugin },
        rules: { 'gost/require-presenter': 'error' },
      },
    ],
  });
  const ready = component(input + 'const name = $derived(user.name);');

  expect(
    (await eslint.lintText(ready.code, { filePath: ready.filename }))[0]
      .messages,
  ).toEqual([]);

  const call = component(
    input +
      imported +
      'const ready = $derived(personPresenter({ state: user }));',
  );

  await expect(
    eslint.lintText(call.code, { filePath: call.filename }),
  ).rejects.toThrow(/type information/);
});
