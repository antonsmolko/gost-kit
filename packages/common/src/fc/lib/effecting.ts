import type { AsyncFn, Ulx } from '../../types';
import type { Dispatch } from '../types/dispatch';
import type { Effector } from '../types/effector';
import type { Trigger } from '../types/trigger';
import type { EffectorHandlers } from '../types/effector-handlers';
import type { Tables } from '../types/tables';
import type { Unique } from '../types/unique';
import type { Complete } from '../types/complete';

// The mapped types correlate each key with its payload. TypeScript loses that
// correlation at a dynamic union-key lookup; keep the assertion at this boundary.
export const effecting = <
  TAction extends Trigger, TEffect extends Trigger,
  const THandlerTables extends Tables<Partial<EffectorHandlers<TAction, TEffect>>>,
>(
  ...targets: Unique<THandlerTables>
    & Complete<THandlerTables, TEffect>
    & readonly Partial<EffectorHandlers<TAction, TEffect>>[]
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
