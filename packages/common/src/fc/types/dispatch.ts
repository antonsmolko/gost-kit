import type { AsyncTap } from '../../types';
import type { Trigger } from './trigger';
import type { DispatchAction } from './dispatch-action';

export type Dispatch<TAction extends Trigger> = AsyncTap<DispatchAction<TAction>>;
