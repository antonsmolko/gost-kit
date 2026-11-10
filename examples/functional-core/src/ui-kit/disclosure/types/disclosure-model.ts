import type { AnyFn, Dispatch } from '@gost-kit/common';
import type { DisclosureState } from '../domain/fc/state';
import type { DisclosureAction } from '../domain/fc/action';

export type DisclosureModel = {
  readonly state: DisclosureState;
  dispatch: Dispatch<DisclosureAction>;
  reset: AnyFn<[], Promise<void>>;
};
