import { safeRun } from '../../sharred';
import { getTriggerName } from './get-trigger-name';
import { logger } from '../../logger';
import type { Trigger } from '../../fc';

const log = logger();

export const logInfoAsync = <TPayload extends { trigger: Trigger }>(payload: TPayload) => {
  safeRun.async(async () => {
    log.info(
      getTriggerName(payload.trigger),
      JSON.parse(JSON.stringify(payload)),
    );
  });
}
