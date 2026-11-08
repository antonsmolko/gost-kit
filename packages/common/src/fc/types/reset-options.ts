import type { AnyFn } from '../../types';

type IsUnion<TState, TWhole = TState> = TState extends TWhole
  ? [TWhole] extends [TState]
    ? false
    : true
  : never;

type ExcludedKey<TState> =
  true extends IsUnion<TState>
    ? never
    : [TState] extends [object]
      ? TState extends readonly unknown[] | AnyFn
        ? never
        : keyof TState
      : never;

export type ResetOptions<TState> = {
  excluded?: readonly ExcludedKey<TState>[];
};
