import type { AnyFn } from './any-fn';

export type DeepPartial<T> = T extends AnyFn
  ? T
  : T extends readonly unknown[]
    ? { [Key in keyof T]: DeepPartial<T[Key]> }
    : T extends object
      ? { [Key in keyof T]?: DeepPartial<T[Key]> }
      : T;
