import type { Trigger } from './trigger';

/**
 * Namespace of an action. An action declared without scope belongs to root;
 * its source type does not need a scope?: 'root' field.
 * Feature scopes must be required. An optional scope is treated as root, so
 * scope?: 'users' is not a supported feature declaration; use ScopedActions.
 */
export type ActionScope<TAction extends Trigger> = TAction extends { scope: infer TScope extends string }
  ? TScope
  : 'root';
