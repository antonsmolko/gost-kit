import type { Vdx } from '../../types/vdx.ts';
import type { Trigger } from './trigger.ts';

export type Draft<TState, TEffect extends Trigger> = Vdx<{ state?: TState; effects?: TEffect | TEffect[] }>;
