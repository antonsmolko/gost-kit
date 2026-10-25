import type { AsyncTap } from '../../types';
import type { Trigger } from './trigger';
import type { DispatchAction } from './dispatch-action';

/**
 * Accepts both ScopedActions and ordinary unscoped root declarations.
 * DispatchAction also supports explicit root scope for the latter; applying it
 * to an already scoped union preserves the accepted actions.
 */
export type Dispatch<TAction extends Trigger> = AsyncTap<DispatchAction<TAction>>;
