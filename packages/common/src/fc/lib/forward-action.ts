import type { Dispatch } from '../types/dispatch';
import type { DispatchAction } from '../types/dispatch-action';
import type { DispatchArguments } from '../types/dispatch-arguments';
import type { Trigger } from '../types/trigger';

export const forwardAction = <TAction extends Trigger>(
  dispatch: Dispatch<TAction>,
  action: DispatchAction<TAction>,
): Promise<void> => {
  const path = `${action.scope ?? 'root'}/${action.type}`;
  const args = Object.hasOwn(action, 'payload')
    ? [path, (action as Trigger & { payload?: unknown }).payload]
    : [path];

  // The action union already correlates namespace, type and payload. Building
  // its argument tuple dynamically loses only that proven relationship.
  return dispatch(...(args as DispatchArguments<TAction>));
};
