import type { Trigger } from './trigger';

export type Commit<TState, TEffect extends Trigger> = { state: TState; effects: TEffect[] };
