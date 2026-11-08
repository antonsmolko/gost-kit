import type { AnyFn } from '../../types';
import type { ResetError } from './reset-error';

export type ResetConfig<TState> = {
  initState: AnyFn<[], TState>;
  readState: AnyFn<[], TState>;
  writeState: AnyFn<[state: TState], void>;
  onError?: AnyFn<[failure: ResetError], void>;
};
