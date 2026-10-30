import type { AsyncFn } from '../../types/async-fn';
import type { Dispatch } from './dispatch';
import type { Trigger } from './trigger';

export type Effector<TAction extends Trigger, TEffect extends Trigger> = AsyncFn<
  [effect: TEffect, dispatch: Dispatch<TAction>], void
>;
