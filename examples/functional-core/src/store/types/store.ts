import type { Store } from '@gost-kit/common';
import type { RootAction } from './action';
import type { RootState } from './state';

export type RootStore = Store<RootState, RootAction>;
