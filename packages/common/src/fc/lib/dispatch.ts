import { report } from '../../sharred';
import type { Dispatch } from '../types/dispatch';
import type { DispatchConfig } from '../types/dispatch-config';
import type { Trigger } from '../types/trigger';

export const createDispatch = <TState, TAction extends Trigger, TEffect extends Trigger>(
  {
    readState,
    writeState,
    reducer,
    effector,
    onError
  }: DispatchConfig<TState, TAction, TEffect>,
): Dispatch<TAction> => {
  const dispatch: Dispatch<TAction> = async (action) => {
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
        commit.effects.map(async (effect) => effector(effect, dispatch)),
      );

      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          report({ kind: 'effect', action, effect: commit.effects[index], error: result.reason }, onError);
        }
      }
    } catch (error) {
      report({ kind: 'reducer', action, error }, onError);
    }
  };

  return dispatch;
};
