import type { Trigger } from './trigger';
import type { ActionScope } from './action-scope';

type PathSegment<TValue extends string> = TValue extends
  '' | `${string}/${string}`
  ? never
  : TValue;

export type DispatchPath<TAction extends Trigger> = TAction extends Trigger
  ? Exclude<keyof TAction, 'scope' | 'type' | 'payload'> extends never
    ? [ActionScope<TAction>] extends [PathSegment<ActionScope<TAction>>]
      ? [TAction['type']] extends [PathSegment<TAction['type']>]
        ? `${ActionScope<TAction>}/${TAction['type']}`
        : never
      : never
    : never
  : never;
