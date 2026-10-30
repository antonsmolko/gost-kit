export type AnyFn<Args extends unknown[] = never[], Result = unknown> = (
  ...args: Args
) => Result;
