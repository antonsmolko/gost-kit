import { report } from '../../sharred';
import type { Dispatch } from '../types/dispatch';
import type { DispatchConfig } from '../types/dispatch-config';
import type { Trigger } from '../types/trigger';

export const createDispatch = <TState, TAction extends Trigger, TEffect extends Trigger>(
  config: DispatchConfig<TState, TAction, TEffect>,
): Dispatch<TAction> => {
  const onError = config.onError;

  const dispatch: Dispatch<TAction> = async (action) => {
    let state: TState;

    try {
      state = config.readState();
    } catch (error) {
      await report({ kind: 'readState', action, error }, onError);
      return;
    }

    try {
      const commit = config.reducer(state, action);

      try {
        config.writeState(commit.state);
      } catch (error) {
        await report({ kind: 'writeState', action, error }, onError);
        return;
      }

      const results = await Promise.allSettled(
        commit.effects.map(async (effect) => config.effector(effect, dispatch)),
      );

      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          await report({ kind: 'effect', action, effect: commit.effects[index], error: result.reason }, onError);
        }
      }
    } catch (error) {
      await report({ kind: 'reducer', action, error }, onError);
    }
  };

  return dispatch;
};
