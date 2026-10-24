import type { AsyncFn } from '../../types/async-fn';
import type { Dispatch } from './dispatch';
import type { Trigger } from './trigger';

export type EffectorHandlers<TAction extends Trigger, TEffect extends Trigger> = {
  [TEffectType in TEffect['type']]: AsyncFn<[params: { effect: Extract<TEffect, { type: TEffectType }>; dispatch: Dispatch<TAction> }]>;
};
