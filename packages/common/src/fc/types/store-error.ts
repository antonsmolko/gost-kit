import type { Trigger } from './trigger';
import type { ResetError } from './reset-error';
import type { DispatchError } from './dispatch-error';
import type { ActionInput } from './action-input';

export type StoreError<TAction extends Trigger, TEffect extends Trigger> =
  | ({
      action: ActionInput<TAction>;
      error: unknown;
    } & (
      | { kind: 'readState' }
      | { kind: 'reducer' }
      | { kind: 'writeState' }
      | { kind: 'effect'; effect: TEffect }
    ))
  | ResetError
  | DispatchError;
