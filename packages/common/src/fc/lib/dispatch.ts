import { report } from '../../sharred/lib/report';
import type { Dispatch } from '../types/dispatch';
import type { DispatchConfig } from '../types/dispatch-config';
import type { Trigger } from '../types/trigger';

export const createDispatch = <TState, TAction extends Trigger, TEffect extends Trigger>(
  config: DispatchConfig<TState, TAction, TEffect>,
): Dispatch<TAction> => {
  const onError = config.onError;

  const dispatch: Dispatch<TAction> = async (action) => {
    try {
      const commit = config.reducer(config.readState(), action);

      config.writeState(commit.state);

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
