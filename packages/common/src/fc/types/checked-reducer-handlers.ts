import type { ExactState } from './exact-state';
import type { DeepReadonly } from '../../types';

/** Validates inferred handler results without requiring return annotations. */
export type CheckedReducerHandlers<TState, THandlers> = {
  [TKey in keyof THandlers]: THandlers[TKey] extends (...args: infer TParams) => infer TResult
    ? (...args: TParams) => TResult extends { state?: infer TNextState }
      ? TResult & { state?: ExactState<DeepReadonly<TState>, TNextState> }
      : TResult
    : never;
};
