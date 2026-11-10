import { define } from '@gost-kit/common';

export type DisclosureState = { readonly open: boolean };

export const disclosureState = define.state<DisclosureState>((options = {}) => {
  return { open: false, ...options };
});
