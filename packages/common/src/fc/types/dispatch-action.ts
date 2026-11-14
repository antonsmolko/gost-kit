import type { Trigger } from './trigger';

/**
 * Object action returned by API callbacks or passed to reducers.
 * Feature scopes are required; local root declarations may omit scope.
 * Public dispatch receives a path and payload, rather than this object.
 */
export type DispatchAction<TAction extends Trigger> = TAction extends {
  scope: string;
}
  ? TAction
  : TAction & { scope?: 'root' };
