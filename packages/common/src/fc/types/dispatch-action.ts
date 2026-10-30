import type { Trigger } from './trigger';

/**
 * Dispatch input: feature actions keep their required scope; unscoped root
 * declarations also accept an explicit scope: 'root'. This only changes types;
 * dispatch passes the original object through without injecting a scope field.
 * Only root may have an optional scope; feature scopes must be required.
 */
export type DispatchAction<TAction extends Trigger> = TAction extends { scope: string }
  ? TAction
  : TAction & { scope?: 'root' };
