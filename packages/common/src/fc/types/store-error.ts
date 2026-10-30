import type { Trigger } from './trigger';

export type StoreError<TAction extends Trigger, TEffect extends Trigger> = {
  action: TAction;
  error: unknown;
} & (
  | { kind: 'readState' }
  | { kind: 'reducer' }
  | { kind: 'writeState' }
  | { kind: 'effect'; effect: TEffect }
);
