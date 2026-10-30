import type { Commit } from './commit';
import type { Trigger } from './trigger';

export type Reducer<TState, TAction extends Trigger, TEffect extends Trigger> = (state: TState, action: TAction) => Commit<TState, TEffect>;
