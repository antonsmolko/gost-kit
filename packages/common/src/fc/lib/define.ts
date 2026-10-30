import { guard } from '../../sharred';
import type { Fn, Rec } from '../../types';
import type { Trigger } from '../types/trigger';
import type { ReducerHandlers } from '../types/reducer-handlers';
import type { EffectorHandlers } from '../types/effector-handlers';
import type { CheckedReducerHandlers } from '../types/checked-reducer-handlers';

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
  // Infer handler results first; NoInfer keeps validation from widening away extra keys.
  reducer: <TState, TAction extends Trigger, TEffect extends Trigger = never, TRootState = TState>() =>
    <THandlers extends ReducerHandlers<TState, TAction, TEffect, TRootState>>(
      handlers: THandlers & (NoInfer<THandlers> extends CheckedReducerHandlers<TState, NoInfer<THandlers>>
        ? unknown
        : CheckedReducerHandlers<TState, NoInfer<THandlers>>),
    ): ReducerHandlers<TState, TAction, TEffect, TRootState> => handlers,
  effector: <TAction extends Trigger, TEffect extends Trigger>(
    handlers: EffectorHandlers<TAction, TEffect>,
  ) => {
    return handlers;
  },
};
