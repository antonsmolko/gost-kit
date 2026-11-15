import type { Commit } from './commit';
import type { Trigger } from './trigger';
import type { ActionInput } from './action-input';

export type Reducer<
  TState,
  TAction extends Trigger,
  TEffect extends Trigger,
> = (state: TState, action: ActionInput<TAction>) => Commit<TState, TEffect>;
