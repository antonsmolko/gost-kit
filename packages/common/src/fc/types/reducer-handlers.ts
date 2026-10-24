import type { Trigger } from './trigger';
import type { Draft } from './draft';

export type ReducerHandlers<TState, TAction extends Trigger, TEffect extends Trigger> = {
  [TActionType in TAction['type']]: (params: { state: TState; action: Extract<TAction, { type: TActionType }> }) => Draft<TState, TEffect>;
};
