import type { Trigger } from './trigger';
import type { ActionScope } from './action-scope';
import type { ActionsInScope } from './actions-in-scope';
import type { ReducerHandlers } from './reducer-handlers';
import type { Rec } from '../../types';

/**
 * Root handler tables grouped by action namespace. Each table covers only its
 * own actions; equal type names in different namespaces retain distinct payloads.
 * This groups handlers after scope(stateKey, featureHandlers) adapts their state.
 * With never actions, the map must be empty. This also rejects nonempty reducing
 * calls when neither a result contract nor explicit generic arguments are given.
 */
export type ScopedReducerHandlers<TState, TAction extends Trigger, TEffect extends Trigger, TRootState = TState> = [TAction] extends [never]
  ? Rec<never>
  : {
      [TScope in ActionScope<TAction>]: ReducerHandlers<TState, ActionsInScope<TAction, TScope>, TEffect, TRootState>;
    };
