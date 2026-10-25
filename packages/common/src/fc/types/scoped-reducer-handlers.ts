import type { Trigger } from './trigger';
import type { ActionScope } from './action-scope';
import type { ActionsInScope } from './actions-in-scope';
import type { ReducerHandlers } from './reducer-handlers';

/**
 * Root handler tables grouped by action namespace. Each table covers only its
 * own actions; equal type names in different namespaces retain distinct payloads.
 * This groups handlers after scope(stateKey, featureHandlers) adapts their state.
 */
export type ScopedReducerHandlers<TState, TAction extends Trigger, TEffect extends Trigger, TRootState = TState> = {
  [TScope in ActionScope<TAction>]: ReducerHandlers<TState, ActionsInScope<TAction, TScope>, TEffect, TRootState>;
};
