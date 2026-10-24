import type { Trigger } from './trigger.ts';

export type Commit<TState, TEffect extends Trigger> = { state: TState; effects: TEffect[] };
