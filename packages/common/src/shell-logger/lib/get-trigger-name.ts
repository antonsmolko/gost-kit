import type { Trigger } from '../../fc';

const FALLBACK_NAME = 'UnknownTrigger';

export const getTriggerName = <Action extends Trigger, Effect extends Trigger>(action: Action | Effect): string => {
  try {
    return action.type ?? FALLBACK_NAME;
  } catch {
    return FALLBACK_NAME;
  }
};