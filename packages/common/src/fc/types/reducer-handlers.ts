import type { Trigger } from './trigger.ts';
import type { Draft } from './draft.ts';

export type ReducerHandlers<TState, TAction extends Trigger, TEffect extends Trigger> = {
  [TActionType in TAction['type']]: (params: { state: TState; action: Extract<TAction, { type: TActionType }> }) => Draft<TState, TEffect>;
};
