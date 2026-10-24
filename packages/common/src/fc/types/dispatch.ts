import type { AsyncTap } from '../../types/async-tap';
import type { Trigger } from './trigger';

export type Dispatch<TAction extends Trigger> = AsyncTap<TAction>;
