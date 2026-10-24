import type { Trigger } from './trigger.ts';

export type StoreError<TAction extends Trigger, TEffect extends Trigger> =
  | { kind: 'reducer'; action: TAction; error: unknown }
  | { kind: 'effect'; action: TAction; effect: TEffect; error: unknown };
