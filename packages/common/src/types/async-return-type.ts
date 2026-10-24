import type { AsyncFn } from './async-fn';

export type AsyncReturnType<Fn extends AsyncFn> = Awaited<ReturnType<Fn>>;
