import { afterAll, describe, expect, test } from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { ESLint } from 'eslint';
import * as svelte from 'svelte-eslint-parser';
import ts from 'typescript-eslint';
import { requireFeatureStateSelector } from './require-feature-state-selector';
import { plugin } from '../index';
import { presenterFixtures } from './require-presenter.test-helper';

const { root, component } = presenterFixtures();

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const script = `import type { Store } from '@gost-kit/common';
import { personPresenter } from './person.presenter';
type State = { user: { name: string }; other: { name: string } };
declare const root: Store<State, {type:'RunAction'}>;
let raw = $state.raw({ user: { name: 'Ada' } });
const rows = [{ id: 1, name: 'Ada' }];
const user = $derived(root.state.user);
const ordinary = { state: { user: { name: 'Ada' } } };
`;
const markup = (expression: string) => {
  return `{#each rows as row (row.id)}{@const result = ${expression}}<p>Ready</p>{/each}`;
};
const valid = [
  'personPresenter({ state: row })',
  'personPresenter({ state: user })',
  'personPresenter({ state: ordinary.state.user })',
  'root.state.user',
  '() => personPresenter({ state: root.state.user })',
].map((expression) => {
  return component(script, markup(expression));
});

valid.push(
  component(
    script,
    '{#each rows as row (row.id)}{@const user = root.state.user}{@const view = personPresenter({state:user})}<p>{view.label}</p>{/each}',
  ),
);

const invalid = [
  'personPresenter({ state: root.state.user })',
  'personPresenter({ state: raw.user })',
  'new Map([[root.state.user, 1]])',
  'String.raw`user:${root.state.user}`',
].map((expression) => {
  return {
    ...component(script, markup(expression)),
    errors: [{ messageId: 'selectTemplateFeature' as const }],
    output: null,
  };
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
}).run('const-state-selector', requireFeatureStateSelector, { valid, invalid });

test('combines presenter and selector rules without duplicate presenter diagnostics', async () => {
  const file = component(
    script,
    markup('personPresenter({ state: root.state.user })'),
  );
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.svelte'],
        languageOptions: {
          parser: svelte,
          parserOptions: {
            parser: ts.parser,
            projectService: true,
            tsconfigRootDir: root,
            extraFileExtensions: ['.svelte'],
          },
        },
        plugins: { gost: plugin },
        rules: {
          'gost/require-feature-state-selector': 'error',
          'gost/require-presenter': 'error',
        },
      },
    ],
  });
  const [result] = await eslint.lintText(file.code, {
    filePath: file.filename,
  });

  expect(
    result.messages.map((message) => {
      return message.ruleId;
    }),
  ).toEqual(['gost/require-feature-state-selector']);
  expect(result.messages[0].fix).toBeUndefined();
});
