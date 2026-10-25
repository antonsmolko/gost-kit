import type { Trigger } from './trigger';

/**
 * Namespace of an action. An action declared without scope belongs to root;
 * its source type does not need a scope?: 'root' field.
 */
export type ActionScope<TAction extends Trigger> = TAction extends { scope: infer TScope extends string }
  ? TScope
  : 'root';
