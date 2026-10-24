import type { AsyncTap } from '../../types/async-tap.ts';
import type { Trigger } from './trigger.ts';

export type Dispatch<TAction extends Trigger> = AsyncTap<TAction>;
