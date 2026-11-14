import type { Trigger } from './trigger';
import type { DispatchArguments } from './dispatch-arguments';

/**
 * A correlated namespace/action path and its declared payload.
 * Actions declared without scope use the explicit root namespace.
 */
export type Dispatch<TAction extends Trigger> = (
  ...args: DispatchArguments<TAction>
) => Promise<void>;
