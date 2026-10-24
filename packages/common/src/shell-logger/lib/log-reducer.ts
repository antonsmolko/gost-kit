import type { Reducer, Trigger } from '../../fc';
import type { LogConfig } from '../types/log-config';
import { logInfoAsync } from './log-info-async';

export const logReducer = <State, Action extends Trigger, Effect extends Trigger>(reducer: Reducer<State, Action, Effect>, config?: LogConfig): Reducer<State, Action, Effect> => {
  return (state, action) => {
    const commit = reducer(state, action);

    if (!config?.isEnabled) {
      return commit;
    }

    logInfoAsync({
      trigger: action,
      prev: state,
      next: commit.state,
      effects: commit.effects,
    });

    return commit;
  };
};
