import type { AsyncFn } from '../../types/async-fn.ts';
import type { Dispatch } from './dispatch.ts';
import type { Trigger } from './trigger.ts';

export type Effector<TAction extends Trigger, TEffect extends Trigger> = AsyncFn<
  [effect: TEffect, dispatch: Dispatch<TAction>], void
>;
