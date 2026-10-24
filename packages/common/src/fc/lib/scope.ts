import { guard } from '../../sharred';
import type { ReducerHandlers } from '../types/reducer-handlers';
import type { Trigger } from '../types/trigger';
import type { DeepReadonly } from '../../types';

/** Adapts feature handlers to a root state property, preserving their action keys. */
export const scope = <TRootState, TKey extends keyof TRootState, TAction extends Trigger, TEffect extends Trigger>(
  key: TKey,
  handlers: ReducerHandlers<TRootState[TKey], TAction, TEffect, TRootState>,
): ReducerHandlers<TRootState, TAction, TEffect> => {
  return Object.fromEntries(Object.entries(handlers).map(([type, value]) => {
    // Object.entries loses the correlation between an action key and its payload.
    const handler = value as ReducerHandlers<TRootState[TKey], TAction, TEffect, TRootState>[TAction['type']];
    const scoped: ReducerHandlers<TRootState, TAction, TEffect>[TAction['type']] = ({ state, action }, rootState) => {
      const draft = handler({ state: state[key] as DeepReadonly<TRootState[TKey]>, action }, rootState);
      const nextState = draft?.state;
      return {
        state: guard.ulx(nextState) ? undefined : { ...state, [key]: nextState },
        effects: draft?.effects,
      };
    };
    return [type, scoped];
  })) as unknown as ReducerHandlers<TRootState, TAction, TEffect>;
};
