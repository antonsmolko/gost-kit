import type { AsyncFn } from '../../types/async-fn.ts';
import type { Ulx } from '../../types/ulx.ts';
import type { Dispatch } from '../types/dispatch.ts';
import type { Effector } from '../types/effector.ts';
import type { Trigger } from '../types/trigger.ts';
import type { EffectorHandlers } from '../types/effector-handlers.ts';
import type { Tables } from '../types/tables.ts';
import type { Unique } from '../types/unique.ts';

// The mapped types correlate each key with its payload. TypeScript loses that
// correlation at a dynamic union-key lookup; keep the assertion at this boundary.
export const effecting = <
  TAction extends Trigger, TEffect extends Trigger,
  const THandlerTables extends Tables<Partial<EffectorHandlers<TAction, TEffect>>>,
>(
  ...targets: Unique<THandlerTables> & readonly Partial<EffectorHandlers<TAction, TEffect>>[]
): Effector<TAction, TEffect> => {
  const handlers = targets.reduce<Partial<EffectorHandlers<TAction, TEffect>>>(
    (merged, target) => ({ ...merged, ...target }), {},
  );
  return async (effect, dispatch) => {
    const handler = handlers[effect.type as TEffect['type']] as
      Ulx<AsyncFn<[params: { effect: TEffect; dispatch: Dispatch<TAction> }]>>;

    await handler?.({ effect, dispatch });
  };
};
