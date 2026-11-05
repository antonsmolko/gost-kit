import { afterAll, describe, test } from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import * as svelte from 'svelte-eslint-parser';
import ts from 'typescript-eslint';
import { compile } from 'svelte/compiler';
import { noComponentState } from './no-component-state';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

// Compile policy-negative cases too: a parser/compiler error is not this rule's diagnostic.
const component = (code: string) => {
  compile(code, { filename: 'Component.svelte' });

  return { code, filename: 'Component.svelte' };
};
const valid = [
  '<script lang="ts">import type { undefined } from "./types"; let input = $state(undefined);</script><input bind:this={input} />',
  '<script lang="ts">import { type undefined } from "./types"; let input = $state(undefined);</script><input bind:this={input} />',

  '<script lang="ts">type undefined = string; let input = $state(undefined);</script><input bind:this={input} />',
  '<script>let input = $state();</script><input aria-label="Query" bind:this={input} />',
  '<p>Ready</p>',
  '<script lang="ts">let { title }: { title: string } = $props();</script><p>{title}</p>',
  '<script lang="ts">let { root, present } = $props(); const feature = $derived(root.state.user); const view = $derived(present(feature));</script><p>{view.name}</p>',
  '<script lang="ts">const user = $derived.by(() => 1);</script><p>{user}</p>',
  '<script lang="ts">let input: HTMLInputElement | undefined = $state();</script><input aria-label="Query" bind:this={input} />',
  '<script lang="ts">let input: HTMLInputElement | undefined = $state(undefined);</script><input aria-label="Query" bind:this={input} />',
  '<script lang="ts">let input: HTMLInputElement | null = $state(null);</script><input aria-label="Query" bind:this={input} />',
  '<script lang="ts">let input: HTMLInputElement | null = $state.raw(null);</script><input aria-label="Query" bind:this={input} />',
  '<script lang="ts">import Child from "./Child.svelte"; let child: unknown = $state();</script><Child bind:this={child} />',
  '<script lang="ts">let input: HTMLInputElement | undefined; const focus = () => { input?.focus(); };</script><input aria-label="Query" bind:this={input} /><button type="button" onclick={focus}>Focus</button>',
];
const invalid = [
  [
    'type-only rune import',
    '<script lang="ts">import type { $state } from "./types"; let count = $state(0);</script><p>{count}</p>',
    '$state',
  ],
  [
    'inline type-only rune import',
    '<script lang="ts">import { type $state } from "./types"; let count = $state(0);</script><p>{count}</p>',
    '$state',
  ],

  [
    'type-only rune name',
    '<script lang="ts">type $state = number; let count = $state(0);</script><p>{count}</p>',
    '$state',
  ],
  [
    'type-only raw name',
    '<script lang="ts">type $state = number; let count = $state.raw(0);</script><p>{count}</p>',
    '$state.raw',
  ],
  [
    'type-only bindable name',
    '<script lang="ts">type $bindable = string; let { value = $bindable("") } = $props();</script><p>{value}</p>',
    '$bindable',
  ],
  [
    'JS state without type services',
    '<script>let open = $state(false);</script><p>{open}</p>',
    '$state',
  ],
  [
    'state',
    '<script lang="ts">let open = $state(false);</script><p>{open}</p>',
    '$state',
  ],
  [
    'raw',
    '<script lang="ts">let model = $state.raw({ draft: "" });</script><p>{model.draft}</p>',
    '$state.raw',
  ],
  [
    'bindable prop',
    '<script lang="ts">let { value = $bindable("") } = $props();</script><input aria-label="Query" {value} />',
    '$bindable',
  ],
  [
    'module',
    '<script lang="ts" module>let shared = $state(false);</script><p>{shared}</p>',
    '$state',
  ],
  [
    'legacy module',
    '<script lang="ts" context="module">let shared = $state(false);</script><p>{shared}</p>',
    '$state',
  ],
  [
    'helper',
    '<script lang="ts">const create = () => { let value = $state(0); return value; }; const value = create();</script><p>{value}</p>',
    '$state',
  ],
  [
    'class',
    '<script lang="ts">class Model { value = $state(0); } const model = new Model();</script><p>{model.value}</p>',
    '$state',
  ],
  [
    'missing ref binding',
    '<script lang="ts">let ref: unknown = $state();</script><p>{String(ref)}</p>',
    '$state',
  ],
  [
    'nonempty ref initializer',
    '<script lang="ts">let input: unknown = $state({ draft: "" });</script><input aria-label="Query" bind:this={input} />',
    '$state',
  ],
  [
    'module ref',
    '<script lang="ts" module>let input: unknown = $state();</script><input aria-label="Query" bind:this={input} />',
    '$state',
  ],
  [
    'legacy module ref',
    '<script lang="ts" context="module">let input: unknown = $state();</script><input aria-label="Query" bind:this={input} />',
    '$state',
  ],
  [
    'different lexical binding',
    '<script lang="ts">let input: unknown; const create = () => { let input = $state(); return input; }; void create;</script><input aria-label="Query" bind:this={input} />',
    '$state',
  ],
  [
    'shadowed undefined',
    '<script lang="ts">const undefined = "draft"; let input: unknown = $state(undefined);</script><input aria-label="Query" bind:this={input} />',
    '$state',
  ],
  [
    'not a this binding',
    '<script lang="ts">let value: string | undefined = $state();</script><input aria-label="Query" bind:value />',
    '$state',
  ],
] as const;

new RuleTester({
  languageOptions: {
    parser: svelte,
    parserOptions: { parser: { ts: ts.parser } },
  },
}).run('no-component-state', noComponentState, {
  valid: valid.map(component),
  invalid: invalid.map(([name, code, rune]) => {
    return {
      ...component(code),
      name,
      output: null,
      errors: [{ messageId: 'componentState', data: { rune } }],
    };
  }),
});
new RuleTester({ languageOptions: { parser: ts.parser } }).run(
  'no-component-state lexical scope',
  noComponentState,
  {
    valid: [
      'const $state = (value: number) => value; function run() { type $state = number; return $state(0); }',
      'const $state = (value: number) => value; const value = $state(0);',
      'const $state = { raw: (value: number) => value }; const value = $state.raw(0);',
      'const $bindable = (value: number) => value; const value = $bindable(0);',
      'const presenter = (value: number) => value + 1;',
    ],
    invalid: [
      {
        code: 'let value = $state(0);',
        output: null,
        errors: [{ messageId: 'componentState', data: { rune: '$state' } }],
      },
    ],
  },
);
