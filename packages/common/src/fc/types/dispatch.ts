import type { Trigger } from './trigger';
import type { DispatchArguments } from './dispatch-arguments';
import type { DispatchAction } from './dispatch-action';

/**
 * A correlated namespace/action path and its declared payload.
 * Actions declared without scope use the explicit root namespace.
 */
export type Dispatch<TAction extends Trigger> = (
  ...args: DispatchArguments<TAction> | [action: DispatchAction<TAction>]
) => Promise<void>;
