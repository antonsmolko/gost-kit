import type { Keyof, Rec } from '../../types';
import type { DispatchAction } from './dispatch-action';
import type { Trigger } from './trigger';

/**
 * Builds the application's action union from a namespace-to-local-actions map.
 * Feature action declarations contain only their type and payload. Map keys add
 * their scope; root actions accept omitted or explicit scope: 'root'.
 *
 * @example
 * type Action = ScopedActions<{
 *   users: { type: 'LoadAction'; page: number };
 *   root: { type: 'ShowAlertAction'; message: string };
 * }>;
 */
export type ScopedActions<TActionMap extends Rec<Trigger>> = {
  [TScope in Keyof<TActionMap>]: TScope extends 'root'
    ? DispatchAction<TActionMap[TScope]>
    : TActionMap[TScope] & { scope: TScope };
}[Keyof<TActionMap>];
