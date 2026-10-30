import type { StateMatches } from './state-matches';

/**
 * Alternative for comparison; not used by define.reducer.
 * Validates the full inferred state, including every variant of array elements.
 * Each inferred variant must exactly match at least one allowed state variant.
 * A single invalid variant rejects the whole result instead of being absorbed
 * by a structurally compatible member of the checked union.
 *
 * @example
 * type State = { items: { id: string }[] };
 * type Valid = ExactStateStrict<State, { items: { id: string }[] }>;
 * type Invalid = ExactStateStrict<State, { items: ({ id: string } | { id: string; extra: boolean })[] }>;
 * // Invalid is never: the second array element variant contains an extra key.
 */
export type ExactStateStrict<TState, TNextState> = false extends StateMatches<TState, TNextState>
  ? never
  : TNextState;
