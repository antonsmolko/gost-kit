import { guard } from '../../sharred';
import type { DeepReadonly, Ulx } from '../../types';
import type { Reducer } from '../types/reducer';
import type { Trigger } from '../types/trigger';
import type { Draft } from '../types/draft';
import type { ScopedReducerHandlers } from '../types/scoped-reducer-handlers';
import type { ActionScope } from '../types/action-scope';
import type { DispatchAction } from '../types/dispatch-action';

// The mapped types correlate each key with its payload. TypeScript loses that
// correlation at a dynamic union-key lookup; keep the assertion at this boundary.
export const reducing = <TState = never, TAction extends Trigger = never, TEffect extends Trigger = never>(
  // Infer contracts from the Reducer result before contextually typing handlers.
  handlers: NoInfer<ScopedReducerHandlers<TState, TAction, TEffect>>,
): Reducer<TState, TAction, TEffect> => {
  return (state, action) => {
    const namespace = (action as DispatchAction<TAction>).scope ?? 'root';
    const table: Ulx<(typeof handlers)[ActionScope<TAction>]> = handlers[namespace as ActionScope<TAction>];
    const handler = table?.[action.type as keyof NonNullable<typeof table>] as
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
