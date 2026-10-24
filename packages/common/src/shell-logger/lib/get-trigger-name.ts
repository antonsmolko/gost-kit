import type { Trigger } from '../../fc';

export const getTriggerName = <TTrigger extends Trigger>(trigger: TTrigger): string => {
    return trigger.type;
}
