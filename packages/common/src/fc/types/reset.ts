import type { AnyFn } from '../../types';
import type { ResetOptions } from './reset-options';

export type Reset<TState> = AnyFn<[options?: ResetOptions<TState>], void>;
