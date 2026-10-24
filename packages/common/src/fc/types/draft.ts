import type { Vdx } from '../../types/vdx';
import type { Trigger } from './trigger';

export type Draft<TState, TEffect extends Trigger> = Vdx<{ state?: TState; effects?: TEffect | TEffect[] }>;
