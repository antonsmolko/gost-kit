import { afterAll, describe, test } from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import * as svelte from 'svelte-eslint-parser';
import ts from 'typescript-eslint';
import { requirePresenter } from './require-presenter';
import { presenterFixtures } from './require-presenter.test-helper';

const { root, component } = presenterFixtures();

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const script = `import { personPresenter } from './person.presenter';
import type { Component, Snippet } from 'svelte';
declare const Widget: Component<Record<string, unknown>>;
let { children }: { children: Snippet<[string]> } = $props();
const user = { name: 'Ada' };
const view = { title: 'Ada', html: '<b>Ada</b>', ready: true, active: true, width: '1px', className: 'blue', tag: 'section' as const, rows: [{ id: 1, name: 'Ada' }], props: { title: 'Ada' }, promise: Promise.resolve({ label: 'Ada' }) };
let count = $state(0);
const handle = (...args: unknown[]) => {};
const action = (node: HTMLElement, params?: unknown) => {};
const transition = (node: Element, params?: unknown) => ({});
const attachment = (node: Element) => {};
`;
const valid = [
  '<p>{view.title}</p>',
  '<p>{view?.title}</p>',
  '<p>{view.rows[count].name}</p>',
  '<p>{null}{true}{-1}{`constant`}</p>',
  '<div title={view.title} />',
  '<div title="Hello {view.title}" />',
  '<div class={["base", view.className]} />',
  '<div style:width={view.width} class:active={view.active} />',
  '<Widget {...view.props} label={view.title} />',
  '<Widget props={{ user, ...view.props }} />',
  '<p>{@html view.html}</p>',
  '{#each view.rows as row (row.id)}<span>{row.name}</span>{/each}',
  '{#key user.name}<p>{user.name}</p>{/key}',
  '{#each view.rows as row (row.id)}{@const rowView = personPresenter({ state: row })}<p>{rowView.label}</p>{/each}',
  '{#each view.rows as row (row.id)}{@const { name } = row}<p>{name}</p>{/each}',
  '{@render children(view.title)}',
  '{@render children?.(view.title)}',
  '{#snippet price(value: number = 0)}<p>{value}</p>{/snippet}{@render price(2)}',
  '{#snippet label(value: string = personPresenter({state:user}).label)}<p>{value}</p>{/snippet}{@render label()}',
  '{#await view.promise}<p>Loading</p>{:then data}<p>{data.label}</p>{:catch error}<p>Failed</p>{/await}',
  '<svelte:head><title>{view.title}</title><meta name="description" content={view.title} /></svelte:head>',
  '<svelte:element this={view.tag} title={view.title}><p>{view.title}</p></svelte:element>',
  '<svelte:component this={Widget} title={view.title} />',
  '<button onclick={() => handle(user.name.trim())}>Go</button>',
  '<button on:click={() => handle(user.name.trim())}>Go</button>',
  '<input bind:value={count} />',
  '<input bind:value={() => count, (value) => count = value} />',
  '<div use:action={{ title: user.name.trim() }} />',
  '<div transition:transition={{ title: user.name.trim() }} />',
  '<div {@attach attachment} />',
  '{#if user.name.length > 0}<p>{view.title}</p>{:else if !view.ready}<p>Other</p>{/if}',
  '{#await Promise.resolve(user.name.trim()) then label}<p>{label}</p>{/await}',
].map((markup) => {
  return component(script, markup);
});
const invalid = [
  '<p>{user.name.trim()}</p>',
  '<p>{personPresenter({ state: user }).label}</p>',
  '<p>{count * 100}</p>',
  '<p>{view.title ?? "Unknown"}</p>',
  '<div title={user.name.trim()} />',
  '<Widget label={personPresenter({state:user}).label} />',
  '<div class={view.active ? "a" : "b"} />',
  '<div class:active={!view.active} />',
  '<div style:width={count + "px"} />',
  '<Widget {...{ label: user.name.trim() }} />',
  '<p>{@html view.html.trim()}</p>',
  '{#each view.rows.filter(row => row.name) as row (row.id)}<p>{row.name}</p>{/each}',
  '{#each view.rows as row (row.id + count)}<p>{row.name}</p>{/each}',
  '{#key user.name + count}<p>{view.title}</p>{/key}',
  '{#each view.rows as row (row.id)}{@const name = row.name.trim()}<p>{name}</p>{/each}',
  '{#each view.rows as row (row.id)}{@const rowView = personPresenter({ state: { name: row.name.trim() } })}<p>{rowView.label}</p>{/each}',
  '{@render children(user.name.trim())}',
  '{#snippet price(value: number)}<p>{value * 100}</p>{/snippet}{@render price(2)}',
  '{#snippet price(value: number = count * 100)}<p>{value}</p>{/snippet}{@render price()}',
  '{#snippet card(value: string)}<section><div>{value.trim()}</div></section>{/snippet}{@render card(view.title)}',
  '{#await view.promise}<p>{count + 1}</p>{:then data}<p>{data.label}</p>{:catch error}<p>Failed</p>{/await}',
  '{#await view.promise}<p>Loading</p>{:then data}<p>{data.label.trim()}</p>{:catch error}<p>Failed</p>{/await}',
  '{#await view.promise}<p>Loading</p>{:then data}<p>{data.label}</p>{:catch error}<p>{String(error)}</p>{/await}',
  '<svelte:head><title>{user.name.trim()}</title></svelte:head>',
  '<svelte:head><meta name="description" content={user.name.trim()} /></svelte:head>',
  '<svelte:element this={view.tag} title={user.name.trim()} />',
  '<svelte:element this={view.tag}><p>{user.name.trim()}</p></svelte:element>',
  '<svelte:element this={view.active ? "div" : "section"} />',
  '<svelte:component this={Widget} label={user.name.trim()} />',
].map((markup) => {
  return {
    ...component(script, markup),
    errors: [{ messageId: 'requirePresenter' as const }],
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
}).run('require-presenter templates', requirePresenter, { valid, invalid });
