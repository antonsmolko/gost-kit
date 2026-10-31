import type { AnyFn } from '@gost-kit/common';
import { flushSync } from 'svelte';

export const observe = <TState, TView>(
  read: AnyFn<[], TState>,
  presenter: AnyFn<[state: TState], TView>,
) => {
  const values: TView[] = [];
  const stop = $effect.root(() => {
    const state = $derived(read());
    const viewState = $derived(presenter(state));

    $effect(() => { values.push(viewState); });
  });

  flushSync();
  return { values, stop };
};
