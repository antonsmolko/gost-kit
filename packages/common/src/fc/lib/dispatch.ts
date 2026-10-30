import { report } from '../../sharred';
import type { Dispatch } from '../types/dispatch';
import type { DispatchConfig } from '../types/dispatch-config';
import type { StoreError } from '../types/store-error';
import type { Trigger } from '../types/trigger';

export const createDispatch = <TState, TAction extends Trigger, TEffect extends Trigger>(
  config: DispatchConfig<TState, TAction, TEffect>,
): Dispatch<TAction> => {
  const onError = (failure: StoreError<TAction, TEffect>) => report(failure, config.onError);

  const dispatch: Dispatch<TAction> = async (action) => {
    let state: TState;

    try {
      state = config.readState();
    } catch (error) {
      onError({ kind: 'readState', action, error });
      return;
    }

    try {
      const commit = config.reducer(state, action);

      try {
        config.writeState(commit.state);
      } catch (error) {
        onError({ kind: 'writeState', action, error });
        return;
      }

      const results = await Promise.allSettled(
        commit.effects.map(async (effect) => config.effector(effect, dispatch)),
      );

      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          onError({ kind: 'effect', action, effect: commit.effects[index], error: result.reason });
        }
      }
    } catch (error) {
      onError({ kind: 'reducer', action, error });
    }
  };

  return dispatch;
};
