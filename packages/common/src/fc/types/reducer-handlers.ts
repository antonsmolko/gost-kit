import type { Trigger } from './trigger';
import type { Draft } from './draft';
import type { DeepReadonly } from '../../types';
import type { ActionInput } from './action-input';

export type ReducerHandlers<
  TState,
  TAction extends Trigger,
  TEffect extends Trigger,
  TRootState = TState,
> = {
  [TActionType in TAction['type']]: (
    params: {
      state: DeepReadonly<TState>;
      action: ActionInput<Extract<TAction, { type: TActionType }>>;
    },
    rootState: DeepReadonly<TRootState>,
  ) => Draft<TState, TEffect>;
};
