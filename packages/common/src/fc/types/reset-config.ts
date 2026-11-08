import type { AnyFn } from '../../types';

export type ResetConfig<TState> = {
  initState: AnyFn<[], TState>;
  readState: AnyFn<[], TState>;
  writeState: AnyFn<[state: TState], void>;
};
