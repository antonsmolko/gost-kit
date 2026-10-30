import type { Keyof, Rec } from '../../types';
import type { DispatchAction } from './dispatch-action';
import type { Trigger } from './trigger';

/**
 * Builds the application's action union from a namespace-to-local-actions map.
 * Local action declarations must not define scope: it is reserved for routing.
 * Map keys add required feature scopes; root actions accept omitted or explicit
 * scope: 'root'.
 *
 * @example
 * type Action = ScopedActions<{
 *   users: { type: 'LoadAction'; page: number };
 *   root: { type: 'ShowAlertAction'; message: string };
 * }>;
 */
export type ScopedActions<TActionMap extends Rec<Trigger & { scope?: never }>> = {
  [TScope in Keyof<TActionMap>]: TScope extends 'root'
    ? DispatchAction<TActionMap[TScope]>
    : TActionMap[TScope] & { scope: TScope };
}[Keyof<TActionMap>];
