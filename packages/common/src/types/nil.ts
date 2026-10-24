import type { Nlx } from './nlx.ts';
import type { Ulx } from './ulx.ts';

export type Nil<T> = Ulx<Nlx<T>>;
