import type { DeepReadonly, Vdx } from '../../types';
import type { Trigger } from './trigger';

export type Draft<TState, TEffect extends Trigger> = Vdx<{ state?: DeepReadonly<TState>; effects?: TEffect | TEffect[] }>;
