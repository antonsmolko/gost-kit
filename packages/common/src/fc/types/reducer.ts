import type { Commit } from './commit.ts';
import type { Trigger } from './trigger.ts';

export type Reducer<TState, TAction extends Trigger, TEffect extends Trigger> = (state: TState, action: TAction) => Commit<TState, TEffect>;
