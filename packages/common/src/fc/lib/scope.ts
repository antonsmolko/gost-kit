import { scopeHandler } from './scope-handler';
import type { ReducerHandlers } from '../types/reducer-handlers';
import type { Trigger } from '../types/trigger';

/** Adapts feature handlers to a root state property, preserving their action keys. */
export const scope = <TRootState, TKey extends keyof TRootState, TAction extends Trigger, TEffect extends Trigger>(
  key: TKey,
  handlers: ReducerHandlers<TRootState[TKey], TAction, TEffect, TRootState>,
): ReducerHandlers<TRootState, TAction, TEffect> => {
  return Object.entries(handlers).reduce((acc, [type, value]) => {
    const handler = value as ReducerHandlers<TRootState[TKey], TAction, TEffect, TRootState>[TAction['type']];

    return {
      ...acc,
      [type as TAction['type']]: scopeHandler<TRootState, TKey, TAction, TEffect>(key, handler)
    };
  }, {} as ReducerHandlers<TRootState, TAction, TEffect>);
};
