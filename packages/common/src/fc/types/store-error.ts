import type { Trigger } from './trigger';

export type StoreError<TAction extends Trigger, TEffect extends Trigger> =
  | { kind: 'readState'; action: TAction; error: unknown }
  | { kind: 'reducer'; action: TAction; error: unknown }
  | { kind: 'writeState'; action: TAction; error: unknown }
  | { kind: 'effect'; action: TAction; effect: TEffect; error: unknown };
