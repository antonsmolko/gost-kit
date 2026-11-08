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

    const initial = initState();

    if (excluded.length === 0) {
      writeState(initial);

      return;
    }

    const current = readState();

    if (!guard.record(current) || !guard.record(initial)) {
      throw new TypeError('Reset exclusions require record state');
    }

    const next = excluded
      .filter((key) => {
        return Object.hasOwn(current, key) && Object.hasOwn(initial, key);
      })
      .reduce((state, key) => {
        return { ...state, [key]: current[key] };
      }, initial);

    writeState(next);
  };
};
