import type { AsyncFn } from '../../types/async-fn.ts';
import type { Dispatch } from './dispatch.ts';
import type { Trigger } from './trigger.ts';

export type EffectorHandlers<TAction extends Trigger, TEffect extends Trigger> = {
  [TEffectType in TEffect['type']]: AsyncFn<[params: { effect: Extract<TEffect, { type: TEffectType }>; dispatch: Dispatch<TAction> }]>;
};
