import type { Trigger } from './trigger';
import type { ActionScope } from './action-scope';

/** Selects the action variants belonging to one namespace, preserving their payloads. */
export type ActionsInScope<TAction extends Trigger, TScope extends string> = TAction extends unknown
  ? ActionScope<TAction> extends TScope ? TAction : never
  : never;
