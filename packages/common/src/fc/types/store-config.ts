import type { AnyFn } from '../../types';
import type { Effector } from './effector';
import type { StoreError } from './store-error';
import type { Reducer } from './reducer';
import type { Trigger } from './trigger';

export type StoreConfig<TState, TAction extends Trigger, TEffect extends Trigger> = {
  initState: TState;
  reducer: Reducer<TState, TAction, TEffect>;
  effector: Effector<TAction, TEffect>;
  onError?: AnyFn<[failure: StoreError<TAction, TEffect>], void>;
};
