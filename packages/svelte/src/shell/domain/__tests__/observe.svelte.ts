import { flushSync } from 'svelte';

export const observe = <T>(read: () => T) => {
  const values: T[] = [];
  const stop = $effect.root(() => {
    $effect(() => { values.push(read()); });
  });
  flushSync();
  return { values, stop };
};
