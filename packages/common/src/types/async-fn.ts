export type AsyncFn<Args extends unknown[] = never[], Result = unknown> = (
  ...args: Args
) => Promise<Result>;
