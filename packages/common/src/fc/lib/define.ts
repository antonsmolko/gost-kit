import { guard } from '../../sharred';
import type { Fn, Rec } from '../../types';
import type { Trigger } from '../types/trigger';
import type { ReducerHandlers } from '../types/reducer-handlers';
import type { EffectorHandlers } from '../types/effector-handlers';

export const define = {
  state: <
    TState extends Rec,
    TStateOptions extends Partial<TState> = Partial<TState>,
  >(
    value: TState | Fn<TStateOptions, TState>,
  ): Fn<TStateOptions, TState> => {
    if (guard.function(value)) {
      return value;
    }

    return (options) => {
      return { ...value, ...options };
    };
  },
  reducer: <TState, TAction extends Trigger, TEffect extends Trigger = never>(
    handlers: ReducerHandlers<TState, TAction, TEffect>,
  ) => {
    return handlers;
  },
  effector: <TAction extends Trigger, TEffect extends Trigger>(
    handlers: EffectorHandlers<TAction, TEffect>,
  ) => {
    return handlers;
  },
};
