import { guard } from '../../sharred/lib/guard.ts';
import type { Ulx } from '../../types/ulx.ts';
import type { Reducer } from '../types/reducer.ts';
import type { Trigger } from '../types/trigger.ts';
import type { Draft } from '../types/draft.ts';
import type { ReducerHandlers } from '../types/reducer-handlers.ts';
import type { Tables } from '../types/tables.ts';
import type { Unique } from '../types/unique.ts';

// The mapped types correlate each key with its payload. TypeScript loses that
// correlation at a dynamic union-key lookup; keep the assertion at this boundary.
export const reducing = <
  TState, TAction extends Trigger, TEffect extends Trigger,
  const THandlerTables extends Tables<Partial<ReducerHandlers<TState, TAction, TEffect>>>,
>(
  ...targets: Unique<THandlerTables> & readonly Partial<ReducerHandlers<TState, TAction, TEffect>>[]
): Reducer<TState, TAction, TEffect> => {
  const handlers = targets.reduce<Partial<ReducerHandlers<TState, TAction, TEffect>>>(
    (merged, target) => ({ ...merged, ...target }), {},
  );
  return (state, action) => {
    const handler = handlers[action.type as TAction['type']] as
      Ulx<(params: { state: TState; action: TAction }) => Draft<TState, TEffect>>;
    const draft = handler?.({ state, action });
    const effects = draft?.effects;

    return {
      state: guard.ulx(draft?.state) ? state : draft.state,
      effects: guard.ulx(effects) ? [] : guard.array<TEffect>(effects) ? effects : [effects],
    };
  };
};
