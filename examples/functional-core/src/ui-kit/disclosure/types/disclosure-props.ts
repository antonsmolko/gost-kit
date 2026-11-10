import type { Snippet } from 'svelte';
import type { DisclosureOptions } from './disclosure-options';

export type DisclosureProps = DisclosureOptions & {
  readonly label: string;
  readonly children?: Snippet;
};
