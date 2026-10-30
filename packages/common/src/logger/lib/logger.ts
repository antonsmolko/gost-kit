import type { Rec } from '../../types';
import type { Logger } from '../types/logger';
import { guard, noop } from '../../sharred';

type Config = {
  style?: string;
};

export const logger = (config?: Config): Logger => {
  const style = config?.style ?? 'color:teal;font-weight:bold';

  const info = (message: string, payload?: Rec) => {
    const args = ['📟 %c%s', style, message];
    if (!guard.ulx(payload)) {
      console.log(...args, payload);
    } else {
      console.log(...args);
    }
  };

  return {
    info,
    error: noop.sync,
    trace: noop.sync,
    debug: noop.sync,
    warn: noop.sync,
  };
};
