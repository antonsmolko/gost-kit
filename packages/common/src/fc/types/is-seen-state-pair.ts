/** Compares exact type pairs; structural assignability would hide extra keys. */
export type IsSeenStatePair<TState, TNextState, TSeenStates> = TSeenStates extends unknown
  ? (<TValue>() => TValue extends TSeenStates ? 1 : 2) extends
    (<TValue>() => TValue extends readonly [TState, TNextState] ? 1 : 2)
    ? true
    : false
  : never;
