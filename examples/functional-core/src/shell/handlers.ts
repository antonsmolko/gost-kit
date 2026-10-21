import type { Dispatch, Effector, Reducer, Trigger } from './types.ts';

export type Draft<S, E extends Trigger> = { state?: S; effects?: E | E[] } | void;
export type ReducerHandlers<S, A extends Trigger, E extends Trigger> = {
  [K in A['type']]: (params: { state: S; action: Extract<A, { type: K }> }) => Draft<S, E>;
};
export type EffectorHandlers<A extends Trigger, E extends Trigger> = {
  [K in E['type']]: (params: { effect: Extract<E, { type: K }>; dispatch: Dispatch<A> }) => Promise<unknown>;
};
export const define = {
  reducer: <S, A extends Trigger, E extends Trigger>(handlers: ReducerHandlers<S, A, E>) => handlers,
  effector: <A extends Trigger, E extends Trigger>(handlers: EffectorHandlers<A, E>) => handlers,
};
type DuplicateKeys<T extends readonly unknown[], Seen extends PropertyKey = never> =
  T extends readonly [infer Head, ...infer Rest]
    ? (keyof Head & Seen) | DuplicateKeys<Rest, Seen | keyof Head>
    : never;

type Tables<H> = readonly [] | readonly [H, ...H[]];

// Fixed tuple positions have string indices; a numeric index is a dynamic rest.
type Unique<T extends readonly unknown[]> = {
  [I in keyof T]: T[I] & (I extends number ? never : { [K in DuplicateKeys<T>]: never });
};

// The mapped types correlate each key with its payload. TypeScript loses that
// correlation at a dynamic union-key lookup; keep the assertion at this boundary.
export const reducing = <
  S, A extends Trigger, E extends Trigger,
  const T extends Tables<Partial<ReducerHandlers<S, A, E>>>,
>(
  ...targets: Unique<T> & readonly Partial<ReducerHandlers<S, A, E>>[]
): Reducer<S, A, E> => {
  const handlers = targets.reduce<Partial<ReducerHandlers<S, A, E>>>(
    (merged, target) => ({ ...merged, ...target }), {},
  );
  return (state, action) => {
    const handler = handlers[action.type as A['type']] as
      ((params: { state: S; action: A }) => Draft<S, E>) | undefined;
    const draft = handler?.({ state, action });
    const effects = draft?.effects;
    return {
      state: draft?.state === undefined ? state : draft.state,
      effects: effects === undefined ? [] : Array.isArray(effects) ? effects : [effects],
    };
  };
};

export const effecting = <
  A extends Trigger, E extends Trigger,
  const T extends Tables<Partial<EffectorHandlers<A, E>>>,
>(
  ...targets: Unique<T> & readonly Partial<EffectorHandlers<A, E>>[]
): Effector<A, E> => {
  const handlers = targets.reduce<Partial<EffectorHandlers<A, E>>>(
    (merged, target) => ({ ...merged, ...target }), {},
  );
  return async (effect, dispatch) => {
    const handler = handlers[effect.type as E['type']] as
      ((params: { effect: E; dispatch: Dispatch<A> }) => Promise<unknown>) | undefined;
    await handler?.({ effect, dispatch });
  };
};
