import type { Trigger } from '../../fc';
import { guard } from '../../sharred';

export const getTriggerName = <TTrigger extends Trigger>(trigger: TTrigger): string => {
  if (trigger.type.endsWith('Action') && 'scope' in trigger && guard.stringTruly(trigger.scope) && trigger.scope !== 'root') {
    return `${trigger.scope}/${trigger.type}`;
  }
  return trigger.type;
};
