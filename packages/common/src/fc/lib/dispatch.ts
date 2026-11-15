import { guard, report } from '../../sharred';
import type { Dispatch } from '../types/dispatch';
import type { DispatchConfig } from '../types/dispatch-config';
import type { Trigger } from '../types/trigger';
import type { ActionInput } from '../types/action-input';

export const createDispatch = <
  TState,
  TAction extends Trigger,
  TEffect extends Trigger,
>({
  readState,
  writeState,
  reducer,
  effector,
  onError,
}: DispatchConfig<TState, TAction, TEffect>): Dispatch<TAction> => {
  const dispatch: Dispatch<TAction> = async (...args) => {
    const [input, value] = args as readonly [unknown, unknown?];
    const objectCall = guard.record(input);
    const path = objectCall ? input.action : input;
    const payload = objectCall ? input.payload : value;
    const hasPayload = objectCall ? 'payload' in input : args.length > 1;

    if (!guard.string(path) || !/^[^/]+\/[^/]+$/u.test(path)) {
      report(
        {
          kind: 'dispatch',
          path,
          error: new TypeError('Dispatch path must be namespace/ActionType'),
        },
        onError,
      );

      return;
    }

    const separator = path.indexOf('/');
    // The public tuple union correlates path and payload. Parsing erases that
    // relationship; restore it only at this runtime boundary.
    const action = {
      scope: path.slice(0, separator),
      type: path.slice(separator + 1) as TAction['type'],
      ...(hasPayload ? { payload } : {}),
    } as unknown as ActionInput<TAction>;
    let state: TState;

    try {
      state = readState();
    } catch (error) {
      report({ kind: 'readState', action, error }, onError);

      return;
    }

    try {
      const commit = reducer(state, action);

      try {
        writeState(commit.state);
      } catch (error) {
        report({ kind: 'writeState', action, error }, onError);

        return;
      }

      const results = await Promise.allSettled(
        commit.effects.map(async (effect) => {
          return effector(effect, dispatch);
        }),
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          report(
            {
              kind: 'effect',
              action,
              effect: commit.effects[index],
              error: result.reason,
            },
            onError,
          );
        }
      });
    } catch (error) {
      report({ kind: 'reducer', action, error }, onError);
    }
  };

  return dispatch;
};
