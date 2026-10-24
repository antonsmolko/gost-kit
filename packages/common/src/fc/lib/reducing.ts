import { guard } from '../../sharred';
import type { DeepReadonly, Ulx } from '../../types';
import type { Reducer } from '../types/reducer';
import type { Trigger } from '../types/trigger';
import type { Draft } from '../types/draft';
import type { ReducerHandlers } from '../types/reducer-handlers';
import type { Tables } from '../types/tables';
import type { Unique } from '../types/unique';
import type { Complete } from '../types/complete';

// The mapped types correlate each key with its payload. TypeScript loses that
// correlation at a dynamic union-key lookup; keep the assertion at this boundary.
export const reducing = <
  TState, TAction extends Trigger, TEffect extends Trigger,
  const THandlerTables extends Tables<Partial<ReducerHandlers<TState, TAction, TEffect>>>,
>(
  ...targets: Unique<THandlerTables>
    & Complete<THandlerTables, TAction>
    & readonly Partial<ReducerHandlers<TState, TAction, TEffect>>[]
): Reducer<TState, TAction, TEffect> => {
  const handlers = targets.reduce<Partial<ReducerHandlers<TState, TAction, TEffect>>>(
    (merged, target) => ({ ...merged, ...target }), {},
  );
  return (state, action) => {
    const handler = handlers[action.type as TAction['type']] as
      Ulx<(params: { state: DeepReadonly<TState>; action: TAction }, rootState: DeepReadonly<TState>) => Draft<TState, TEffect>>;
    const readonlyState = state as DeepReadonly<TState>;
    const draft = handler?.({ state: readonlyState, action }, readonlyState);
    const effects = draft?.effects;

    return {
      // DeepReadonly is a handler input/output view; it does not change the stored value.
      state: guard.ulx(draft?.state) ? state : draft.state as TState,
      effects: guard.ulx(effects) ? [] : guard.array<TEffect>(effects) ? effects : [effects],
    };
  };
};
