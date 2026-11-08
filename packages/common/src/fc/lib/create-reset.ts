import { guard } from '../../sharred';
import type { Reset } from '../types/reset';
import type { ResetConfig } from '../types/reset-config';

export const createReset = <TState>({
  initState,
  readState,
  writeState,
}: ResetConfig<TState>): Reset<TState> => {
  return ({ excluded = [] } = {}) => {
    if (!guard.array(excluded)) {
      throw new TypeError('Reset excluded must be an array of root keys');
    }

    const fresh = initState();

    if (excluded.length === 0) {
      writeState(fresh);

      return;
    }

    const current = readState();

    if (!guard.record(current) || !guard.record(fresh)) {
      throw new TypeError('Reset exclusions require record state');
    }

    const next = { ...fresh };

    excluded.forEach((key) => {
      if (!Object.hasOwn(current, key) || !Object.hasOwn(fresh, key)) {
        throw new TypeError(
          `Reset excluded key must exist in both roots: ${String(key)}`,
        );
      }

      // Define a data property so an own __proto__ scope cannot change the prototype.
      Object.defineProperty(next, key, {
        value: current[key],
        enumerable: true,
        configurable: true,
        writable: true,
      });
    });

    writeState(next);
  };
};
