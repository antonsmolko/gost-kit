import type { Vdx } from '../../types/vdx.ts';
import type { Effector } from './effector.ts';
import type { StoreError } from './store-error.ts';
import type { Reducer } from './reducer.ts';
import type { Trigger } from './trigger.ts';

export type StoreConfig<TState, TAction extends Trigger, TEffect extends Trigger> = {
  initState: TState;
  reducer: Reducer<TState, TAction, TEffect>;
  effector: Effector<TAction, TEffect>;
  onError?: (failure: StoreError<TAction, TEffect>) => Vdx<Promise<void>>;
};
