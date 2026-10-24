import { logInfoAsync } from './log-info-async';
import type { Effector, Trigger } from '../../fc';
import type { LogConfig } from '../types/log-config';

export const logEffector = <TAction extends Trigger, TEffect extends Trigger>(effector: Effector<TAction, TEffect>, config?: LogConfig): Effector<TAction, TEffect> => {
  return async (effect, dispatch) => {
    if (config?.isEnabled) {
      logInfoAsync({ trigger: effect });
    }

    await effector(effect, dispatch);
  };
};
