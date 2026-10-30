import { guard } from '../../sharred';
import type { DeepReadonly } from '../../types';
import type { ReducerHandlers } from '../types/reducer-handlers';
import type { Trigger } from '../types/trigger';

export const scopeHandler = <TRootState, TKey extends keyof TRootState, TAction extends Trigger, TEffect extends Trigger>(
  key: TKey,
  handler: ReducerHandlers<TRootState[TKey], TAction, TEffect, TRootState>[TAction['type']],
): ReducerHandlers<TRootState, TAction, TEffect>[TAction['type']] => {
  return ({ state, action }, rootState) => {
    const draft = handler({ state: state[key] as DeepReadonly<TRootState[TKey]>, action }, rootState);
    const nextState = draft?.state;

    return {
      state: guard.ulx(nextState) || nextState === state[key]
        ? undefined
        : { ...state, [key]: nextState },
      effects: draft?.effects,
    };
  };
};
