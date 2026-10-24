import type { AnyFn } from './any-fn.ts';
import type { Trim } from './trim.ts';

export type TrimNested<T> = T extends string
  ? Trim<T>
  : T extends AnyFn
    ? T
    : T extends readonly unknown[]
      ? { [Key in keyof T]: TrimNested<T[Key]> }
      : T extends object
        ? { [Key in keyof T]: TrimNested<T[Key]> }
        : T;
