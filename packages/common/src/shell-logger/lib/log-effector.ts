import { logInfoAsync } from './log-info-async.ts';
import type { Effector, Trigger } from '../../fc';
import type { LogConfig } from '../types/log-config.ts';

export const logEffector = <Action extends Trigger, Effect extends Trigger>(effector: Effector<Action, Effect>, config?: LogConfig): Effector<Action, Effect> => {
  return async (effect, dispatch) => {
    await effector(effect, dispatch);

    if (!config?.isEnabled) {
      return;
    }

    logInfoAsync({ trigger: effect })
  };
};