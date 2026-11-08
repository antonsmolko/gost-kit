import type { Trigger } from './trigger';
import type { ResetError } from './reset-error';

export type StoreError<TAction extends Trigger, TEffect extends Trigger> =
  | ({
      action: TAction;
      error: unknown;
    } & (
      | { kind: 'readState' }
      | { kind: 'reducer' }
      | { kind: 'writeState' }
      | { kind: 'effect'; effect: TEffect }
    ))
  | ResetError;
