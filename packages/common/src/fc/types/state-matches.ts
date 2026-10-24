import type { IsSeenStatePair } from './is-seen-state-pair';

/**
 * Returns a boolean for each inferred variant. Each must match some declared
 * variant, including nested values. A false result must not disappear in a union.
 * Seen pairs stop recursion only for the same exact types, not their subtypes.
 */
export type StateMatches<TState, TNextState, TSeenStates = never> = TNextState extends unknown
  ? true extends (
    TState extends unknown
      ? unknown extends TState
        ? true
        : [TNextState] extends [TState]
          ? true extends IsSeenStatePair<TState, TNextState, TSeenStates>
            ? true
            : TNextState extends readonly unknown[]
              ? TState extends readonly unknown[]
                ? false extends {
                  [TIndex in keyof TNextState]: StateMatches<
                    TIndex extends keyof TState ? TState[TIndex] : TState[number],
                    TNextState[TIndex],
                    TSeenStates | readonly [TState, TNextState]
                  >;
                }[number] ? false : true
                : false
              : TNextState extends object
                ? Exclude<keyof TNextState, keyof TState> extends never
                  ? false extends {
                    [TKey in keyof TNextState]-?: TKey extends keyof TState
                      ? StateMatches<TState[TKey], TNextState[TKey], TSeenStates | readonly [TState, TNextState]>
                      : false;
                  }[keyof TNextState] ? false : true
                  : false
                : true
          : false
      : never
  ) ? true : false
  : never;
