/**
 * Checks an inferred state against its declared shape, including nested keys.
 * Distributes over state unions so nullable and discriminated states remain valid.
 * Used after handler inference; a regular return constraint permits extra keys.
 *
 * Limitation: an inferred union can hide extra keys through a structurally
 * compatible member, for example ({ id: string } | { id: string; extra: true })[].
 * Required fields and their value types are still checked. This simpler version
 * is used by define.reducer; ExactStateStrict is kept separately for comparison.
 */
export type ExactState<TState, TNextState> = TState extends unknown
  ? TNextState extends TState
    ? TNextState extends readonly unknown[]
      ? TState extends readonly (infer TItem)[]
        ? { [TIndex in keyof TNextState]: ExactState<TItem, TNextState[TIndex]> }
        : never
      : TNextState extends object
        ? { [TKey in keyof TNextState]: TKey extends keyof TState ? ExactState<TState[TKey], TNextState[TKey]> : never }
        : TNextState
    : never
  : never;
