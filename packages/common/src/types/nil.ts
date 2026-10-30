import type { Nlx } from './nlx';
import type { Ulx } from './ulx';

export type Nil<T> = Ulx<Nlx<T>>;
