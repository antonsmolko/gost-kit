import type { Reducer, Trigger } from '../../fc';
import type { LogConfig } from '../types/log-config';
import { logInfoAsync } from './log-info-async';

export const logReducer = <TState, TAction extends Trigger, TEffect extends Trigger>(reducer: Reducer<TState, TAction, TEffect>, config?: LogConfig): Reducer<TState, TAction, TEffect> => {
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
