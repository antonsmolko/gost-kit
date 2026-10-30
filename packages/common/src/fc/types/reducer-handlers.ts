import type { Trigger } from './trigger';
import type { Draft } from './draft';
import type { DeepReadonly } from '../../types';

export type ReducerHandlers<TState, TAction extends Trigger, TEffect extends Trigger, TRootState = TState> = {
  [TActionType in TAction['type']]: (
    params: { state: DeepReadonly<TState>; action: Extract<TAction, { type: TActionType }> },
    rootState: DeepReadonly<TRootState>,
  ) => Draft<TState, TEffect>;
};
