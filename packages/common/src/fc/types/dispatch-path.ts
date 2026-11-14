import type { Trigger } from './trigger';
import type { ActionScope } from './action-scope';

export type DispatchPath<TAction extends Trigger> = TAction extends Trigger
  ? `${ActionScope<TAction>}/${TAction['type']}`
  : never;
