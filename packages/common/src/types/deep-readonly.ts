import type { AnyFn } from './any-fn';

/** Readonly view of nested object properties, arrays and tuples; functions remain callable. */
export type DeepReadonly<TValue> = TValue extends AnyFn
  ? TValue
  : TValue extends object
    ? { readonly [TKey in keyof TValue]: DeepReadonly<TValue[TKey]> }
    : TValue;
