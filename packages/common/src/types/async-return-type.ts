import type { AsyncFn } from './async-fn.ts';

export type AsyncReturnType<Fn extends AsyncFn> = Awaited<ReturnType<Fn>>;
